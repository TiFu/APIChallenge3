
var main = null;

exports.init = function(mainApp) {
  main = mainApp;

  main.addEndpoint("/api/player/info/:summonerId", getPlayerInfo);
  main.addEndpoint("/api/player/progression/:summonerId/:championId", getMasteryProgression);
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
  return main.database.query("SELECT summoner_name FROM summoners WHERE summoner_id = ?", [summoner_id]).then((result) => {
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


// Mastery Gains Rank last week
function getGlobalRank() {
  // TODO implement retrieving global rank
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
  return main.database.query("select c.name, sum(pts_gained) / count(pts_gained) as avg_pts_gained, max(mastery_level) as mastery_level FROM gains g, champions c where g.champion_id = c.id and summoner_id = ? and game_timestamp > now() - interval 1 week group by champion_id having avg_pts_gained is not null order by avg_pts_gained desc limit 10", [summoner_id]).then((result) => {
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
