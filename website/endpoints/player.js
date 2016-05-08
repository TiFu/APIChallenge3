var urlencode = require('urlencode');

var main = null;
var counter = 0;
var addedSummoners = {};
exports.name = "player";

exports.init = function(mainApp) {
  main = mainApp;

  main.addEndpoint("/api/player/list", getPlayerList);
  main.addEndpoint("/api/player/info/:summonerId", getPlayerInfo);
  main.addEndpoint("/api/player/info/by-name/:summonerName", getSummonerByName);
  main.addEndpoint("/api/player/progression/:summonerId/:championId", getMasteryProgression);

  process.on("message", (message) => {
    var req = addedSummoners["" + message.token].req;
    var res = addedSummoners["" + message.token].res;
    var next = addedSummoners["" + message.token].next;
    var connection = addedSummoners["" + message.token].connection;
    main.logger.info("Answer from collection: " + message.summoner_id);
    req.params.summonerId = message .summoner_id;
    if (message.success) {
      main.logger.info("Requesting player info");
        getPlayerInfo(req, res, next, connection); // releases connection
    } else {
      res.status(200).send({success: false});
      main.logger.info("Releasing connection");
      main.releaseConnection(connection);
    }
  });
}

function getSummonerByName(req, res, next, connection) {
  var name = urlencode.decode(req.params.summonerName);
  connection.query("SELECT summoner_id FROM summoners WHERE summoner_name = ?", [name]).then((result) => {
    if (result.length == 0) {
      var ourCounter = counter++;
      addedSummoners["" + ourCounter] = {req: req, res: res, next: next, connection: connection};
      process.send({
        workerId: process.env.workerId,
        token: ourCounter,
        data: name
      }); // register user
    } else {
      req.params.summonerId = result[0].summoner_id;
      getPlayerInfo(req, res, next, connection);
    }
  })
}

function getPlayerList(req, res, next, connection) {
  main.logger.info("Getting player list");
  return connection.query("SELECT summoner_id, summoner_name, summoner_icon FROM summoners").then((result) => {
    main.logger.info("sending result");
    res.status(200).send(result);
  }).catch((err) => {
    main.logger.warn(err);
    res.status(500).send("Internal Server Error");
  }).then(() => {
    main.logger.info("Releasing connection");
    main.releaseConnection(connection);
  })
}

function getMasteryProgression(req, res, next, connection) {
  var summoner_id = req.params.summonerId;
  var champion_id = req.params.championId;
  getMasteryProgressionForChamp(summoner_id, champion_id, connection).then((result) => {
    res.status(200).send(result);
  }).catch((err) => {
    main.logger.warn(err);
    res.status(500).send("Internal Server Erorr");
  }).then(() => {
    main.logger.info("Releasing connection");
    main.releaseConnection(connection);
  })
}

function getPlayerInfo(req, res, next, connection) {
  var summoner_id = req.params.summonerId;
  main.logger.info("Getting Player info for : " + summoner_id);
  var promises = [];
  promises.push(getMasteryDistribution(summoner_id, connection));
  promises.push(getTop10Champions(summoner_id, connection));
  promises.push(getLastGames(summoner_id, undefined, connection));
  promises.push(getSummonerName(summoner_id, connection));
  promises.push(getHighestGradeDistribution(summoner_id, connection));
  promises.push(getTop10GainsLastWeek(summoner_id, connection));
  promises.push(getGlobalRank(summoner_id, connection));
  promises.push(getPercentSumsChestGranted(summoner_id, connection));
  promises.push(getSummonerIcon(summoner_id, connection));
  var resultObj = {};
  Promise.all(promises).then((result) => {
    for (var i = 0; i < result.length; i++) {
      resultObj[result[i].name] = result[i].data;
    }
    resultObj.success = true;
    res.status(200).send(resultObj);
  }).catch((err) => {
    main.logger.warn(err);
    res.status(500).send("Internal Server Error");
  }).then(() => {
    main.logger.info("Releasing connection");
    main.releaseConnection(connection);
  });
}

function getPercentSumsChestGranted(summoner_id, connection) {
  var res;
  return connection.query("select sum(chest_granted = 1) as yes from current_mastery where summoner_id = ?;", [summoner_id]).then((result) => {
    res = result[0];
    return connection.query("select count(*) as cnt from champions");
  }).then((champs) => {
    res.no = champs[0].cnt - res.yes;
    return {
      name: "percent_chest_granted",
      data: res
    };
  })
}

function getSummonerIcon(summoner_id, connection) {
  return connection.query("SELECT summoner_icon FROM summoners WHERE summoner_id = ?", [summoner_id]).then((result) => {
    return {
      name: "profile_icon",
      data: result[0].summoner_icon
    };
  });

}

function getSummonerName(summoner_id, connection) {
  return connection.query("SELECT summoner_name, summoner_icon FROM summoners WHERE summoner_id = ?", [summoner_id]).then((result) => {
    return {
      name: "name",
      data: result[0].summoner_name
    };
  });
}

function getMasteryDistribution(summoner_id, connection) {
  var mastery = [0, 0, 0, 0, 0];
  return connection.query("SELECT mastery_level, COUNT(mastery_level) as cnt FROM current_mastery WHERE summoner_id = ? GROUP BY mastery_level", [summoner_id]).then((result) => {
    for (var i = 0; i < result.length; i++) {
      mastery[result[i].mastery_level - 1] = result[i].cnt;
    }
    return connection.query("SELECT count(*) as cnt from champions");
  }).then((champCountQuery) => {
      var elemSum = mastery.reduce((previousValue, currentValue) => previousValue + currentValue, 0);
      mastery[0] += champCountQuery[0].cnt - elemSum;
      var avg = mastery.reduce((previous, current, index) => {
        return previous += current * index;
      }, 0) / elemSum;
      return {
        name: "masterydistribution",
        data: {
          avg: avg,
          distribution: mastery
        }
      }
    });
  }


  function getGlobalRank(summoner_id, connection) {
    return globalRankByWeek(summoner_id, connection).then((result) => {
      return {
        name: "globalrank",
        data: result
      };
    })
  }

  function globalRankByWeek(summoner_id, connection) {
    return connection.query("select rank, avg_gain, games, week from (select @rn:=@rn+1 as rank, summoner_id, avg_gain, week, games FROM (select @rank:=@rank+1 as rank, summoner_id, (to_days(now()) - to_days(game_timestamp)) DIV 3 as week, sum(pts_gained)/count(pts_gained) as avg_gain, count(pts_gained) as games from gains group by summoner_id, TO_DAYS(game_timestamp) DIV 3 having avg_gain is not null order by avg_gain desc) t1, (select @rn:=0) t2) t3 where t3.summoner_id = ? order by week asc;", [summoner_id])
  }

  function getHighestGradeDistribution(summoner_id, connection) {
    return connection.query("SELECT highest_grade, COUNT(*) as cnt FROM current_mastery WHERE summoner_id = ? GROUP BY highest_grade", [summoner_id]).then((result) => {
      return {
        name: "highestgradedistribution",
        data: result
      };
    })
  }

  function getTop10Champions(summoner_id, connection) {
    return connection.query("SELECT c.id, name, case when mastery_level is null then 1 else mastery_level end as mastery_level, case when pts_total is null then 0 else pts_total end as pts_total, case when pts_since is null then 0 else pts_since end as pts_since, case when pts_next is null then 1800 else pts_next end as pts_next, highest_grade, case when chest_granted is null then 0 else chest_granted end as chest_granted FROM champions c LEFT JOIN current_mastery cm on c.id = cm.champion_id and summoner_id = ? ORDER BY pts_total DESC", [summoner_id]).then((result) => {
      return {
        name: "champions",
        data: result
      };
    })
  }

  function getTop10GainsLastWeek(summoner_id, connection) {
    var champions;
    return connection.query("select champion_id, c.name, count(pts_gained) as games, sum(pts_gained) / count(pts_gained) as avg_pts_gained, max(mastery_level) as mastery_level FROM gains g, champions c where g.champion_id = c.id and summoner_id = ? and game_timestamp > now() - interval  3 day group by champion_id having avg_pts_gained is not null order by avg_pts_gained desc limit 10", [summoner_id]).then((result) => {
        champions = result;
        var promises = [];
        for (var i = 0; i < result.length; i++) {
          var current = result[i];
          var prom = function(j) {
            var current = result[j];
            var query = connection.query("select count(*) as cnt from (select sum(pts_gained) / count(pts_gained) as cnt from gains where champion_id = ? and game_timestamp > now() - interval 3 day group by summoner_id having sum(pts_gained) / count(pts_gained) > ?) t1;", [current.champion_id, current.avg_pts_gained]).then((rankRes) => {
               champions[j].rank = rankRes[0].cnt+1;
            });
            return query;
          }(i);
          promises.push(prom);
        }
        return Promise.all(promises);
    }).then(() => {
      return {
        name: "top10gainslastweek",
        data: champions
      };
    });
  }

  function getLastGames(summoner_id, offset, connection) {
    if (!offset) {
      offset = 0;
    }
    return connection.query("SELECT name as champion_name, game_timestamp, mastery_level, pts_gained, pts_next, pts_total, pts_since FROM gains g, champions c where c.id = g.champion_id and g.summoner_id = ? order by game_timestamp desc LIMIT ?, 10", [summoner_id, offset]).then((result) => {
        result = result.map((r) => {
          var date = new Date(r.game_timestamp);
          r.game_timestamp = date.getFullYear() + "-" + ("0" + date.getMonth()).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
          return r;
        })
        return {
        name: "lastgames",
        data: result
      };
    });
  }

  function getMasteryProgressionForChamp(summoner_id, champion_id, connection) {
    return connection.query("SELECT name as champion_name, pts_gained, pts_total, mastery_level, game_timestamp FROM gains g, champions c where c.id = g.champion_id and summoner_id = ? and champion_id = ? ORDER BY game_timestamp ASC", [summoner_id, champion_id]);
  }
