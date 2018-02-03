var util = require('util');
var connection = null;
var logger = null;
var League = null;

exports.init = function(conn, log, leagJS) {
  connection = conn;
  logger = log;
  League = leagJS;
}

exports.start = () => {
  setInterval(() => {
    checkData();
  }, 20*60*1000); // check every 20 minutes.
  checkData();
}
function checkData() {
  return connection.query("SELECT summoner_id FROM summoners").then((result) => {
    for (var i = 0; i < result.length; i++) {
      updateSummoner(result[i].summoner_id);
    }
  })

}

function updateSummoner(summoner_id) {
  logger.info("Updating summoner: " + summoner_id);
  var gameId = null;
  League.getRecentGames(summoner_id).then((result) => {
    if (result == undefined || result.length == 0) {
      throw new Error("No match history received for " + summoner_id + ":" + util.inspect(result, false, null));
    } else {
      result.sort((a, b) => a.createDate < b.createDate);
      gameId = result[0].gameId;
      logger.debug("Requsting Champion Mastery for " + summoner_id);
      return League.ChampionMastery.getChampionMastery(summoner_id, result[0].championId);
    }
  }).then((result) => {
    if (result) {
      logger.debug("Received champion mastery for " + summoner_id);
      return insertMasteryUpdate(summoner_id, result, gameId).catch((err) => true);
    } else {
      throw new Error("No champion mastery received for " + summoner_id + "." + util.inspect(result, false, null));
    }
  }).then(() => {
    logger.debug("Inserted mastery update successfully for " + summoner_id);
    return connection.query("UPDATE summoners SET update_time = now() WHERE summoner_id = " + summoner_id);
  }).then(() => {
    logger.info("Finished update for " + summoner_id);
    return Promise.resolve(true);
  }).catch((err) => {
    logger.warn(err);
    logger.warn("Error fetching infos for " + summoner_id + ": ", err);
    return Promise.resolve(false);
  });
}
function insertMasteryUpdate(summonerId, mastery, gameId) {
  return connection.query("INSERT INTO mastery (summoner_id, champion_id, game_id, championLevel, championPoints, pointsSinceLastLevel, pointsUntilNextLevel) VALUES (" + summonerId + "," + mastery.championId + ", " + gameId + ", " + mastery.championLevel + "," + mastery.championPoints + "," + mastery.championPointsSinceLastLevel + "," + mastery.championPointsUntilNextLevel + ")")
}
