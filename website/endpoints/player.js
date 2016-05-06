var urlencode = require('urlencode');

var main = null;
var counter = 0;
var addedSummoners = {};

exports.init = function(mainApp) {
  main = mainApp;

  main.addEndpoint("/api/player/list", getPlayerList);
  main.addEndpoint("/api/player/info/:summonerId", getPlayerInfo);
  main.addEndpoint("/api/player/info/by-name/:summonerName", getSummonerByName);
  main.addEndpoint("/api/player/progression/:summonerId/:championId", getMasteryProgression);

  process.on("message", (message) => {
    addedSummoners["" + message.token].status(200).send({added: message.success});
  });
}

function getSummonerByName(req, res, next) {
  var name = urlencode.decode(req.params.summonerName);
  main.database.query("SELECT summoner_id FROM summoners WHERE summoner_name = ?", [name]).then((result) => {
    if (result.length == 0) {
      var ourCounter = counter++;
      addedSummoners["" + ourCounter] = res;
      process.send({workerId: process.env.workerId, token: ourCounter, data: name}); // register user
//      res.status(200).send({new: true}); // let's just say we added him. i have actually no idea how to retrive an answer for that...
    } else {
      req.params.summonerId = result[0].summoner_id;
      getPlayerInfo(req, res, next);
    }
  });
}

function getPlayerList(req, res, next) {
  return main.database.query("SELECT summoner_id, summoner_name, summoner_icon FROM summoners").then((result) => {
    res.status(200).send(result);
  }).catch((err) => {
    main.logger.warn(err);
    res.status(500).send("Internal Server Error");
  })
}

function getMasteryProgression(req, res, next) {
  var summoner_id = req.params.summonerId;
  var champion_id = req.params.championId;
  getMasteryProgressionForChamp(summoner_id, champion_id).then((result) => {
    res.status(200).send(result);
  }).catch((err) => {
    main.logger.warn(err);
    res.status(500).send("Internal Server Erorr");
  })
}

function getPlayerInfo(req, res, next) {
  var summoner_id = req.params.summonerId;
  var promises = [];
  promises.push(getMasteryDistribution(summoner_id));
  promises.push(getTop10Champions(summoner_id));
  promises.push(getLastGames(summoner_id));
  promises.push(getSummonerName(summoner_id));
  promises.push(getHighestGradeDistribution(summoner_id));
  promises.push(getTop10GainsLastWeek(summoner_id));
  promises.push(getGlobalRank(summoner_id));
  var resultObj = {};
  Promise.all(promises).then((result) => {
    for (var i = 0; i < result.length; i++) {
      resultObj[result[i].name] = result[i].data;
    }
    res.status(200).send(resultObj);
  }).catch((err) => {
    main.logger.warn(err);
    res.status(500).send("Internal Server Error");
  });
}

function getSummonerName(summoner_id) {
  return main.database.query("SELECT summoner_name, summoner_icon FROM summoners WHERE summoner_id = ?", [summoner_id]).then((result) => {
    return {name: "name", data: result[0].summoner_name};
  });
}

function getMasteryDistribution(summoner_id) {
  var mastery = [0,0,0,0,0,0];
  return main.database.query("SELECT mastery_level, COUNT(mastery_level) as cnt FROM current_mastery WHERE summoner_id = ? GROUP BY mastery_level", [summoner_id]).then((result) => {
      for (var i = 0; i < result.length; i++) {
        mastery[result[i].mastery_level] = result[i].cnt;
      }
      return main.database.query("SELECT count(*) as cnt from champions");
  }).then((champCountQuery) => {
        mastery[0] += champCountQuery[0].cnt - mastery.reduce((previousValue, currentValue) => previousValue + currentValue, 0);
        return {name: "masterydistribution", data: mastery};
  });
}


function getGlobalRank(summoner_id) {
  return globalRankByWeek(summoner_id).then((result) => {
    return {name: "globalrank", data: result};
  })
}

function globalRankByWeek(summoner_id) {
  return main.database.query("select rank, avg_gain, games, week from (select @rn:=@rn+1 as rank, summoner_id, avg_gain, week, games FROM (select @rank:=@rank+1 as rank, summoner_id, (to_days(now()) - to_days(game_timestamp)) DIV 3 as week, sum(pts_gained)/count(pts_gained) as avg_gain, count(pts_gained) as games from gains group by summoner_id, TO_DAYS(game_timestamp) DIV 3 having avg_gain is not null order by avg_gain desc) t1, (select @rn:=0) t2) t3 where t3.summoner_id = ? order by week asc;", [summoner_id])
}

function getHighestGradeDistribution(summoner_id) {
    return main.database.query("SELECT highest_grade as grade, COUNT(highest_grade) as cnt FROM current_mastery WHERE summoner_id = ? and highest_grade is not null GROUP BY highest_grade", [summoner_id]).then((result) => {
      return {name: "highestgradedistribution", data: result};
    })
}

function getTop10Champions(summoner_id) {
  return main.database.query("SELECT name, mastery_level, pts_total, pts_next, pts_since, highest_grade, chest_granted FROM current_mastery cm, champions c WHERE c.id = cm.champion_id and summoner_id = ? ORDER BY pts_total DESC LIMIT 10", [summoner_id]).then((result) => {
    return {name:"top10champions", data: result};
  })
  // TODO add global rank last week regarding champion (with mysql variable) + the respective gain
}

function getTop10GainsLastWeek(summoner_id) {
  return main.database.query("select c.name, count(pts_gained) as games, sum(pts_gained) / count(pts_gained) as avg_pts_gained, max(mastery_level) as mastery_level FROM gains g, champions c where g.champion_id = c.id and summoner_id = ? and game_timestamp > now() - interval  3 day group by champion_id having avg_pts_gained is not null order by avg_pts_gained desc limit 10", [summoner_id]).then((result) => {
    return {name: "top10gainslastweek", data: result};
  });
}

function getLastGames(summoner_id, offset) {
  if (!offset) {
    offset = 0;
  }
  return main.database.query("SELECT name as champion_name, game_timestamp, mastery_level, pts_gained, pts_next, pts_total, pts_since FROM gains g, champions c where c.id = g.champion_id and g.summoner_id = ? order by game_timestamp desc LIMIT ?, 10", [summoner_id, offset]).then((result) => {
    return {name: "lastgames", data: result};
  });
}

function getMasteryProgressionForChamp(summoner_id, champion_id) {
  return main.database.query("SELECT name as champion_name, pts_gained, pts_total, mastery_level, game_timestamp FROM gains g, champions c where c.id = g.champion_id and summoner_id = ? and champion_id = ? ORDER BY game_timestamp ASC", [summoner_id, champion_id]);
}
