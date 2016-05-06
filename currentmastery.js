var connection = null;
var logger = null;
var League = null;

exports.init = function(conn, log, leagJS) {
  connection = conn;
  logger = log;
  League = leagJS;
  setInterval(() => {
    updateCurrentMastery();
  }, 24*60*60*1000); // check every 20 minutes.
  console.log("updating current mastery");
  updateCurrentMastery();
}

function updateCurrentMastery() {
  console.log("selecting");
  connection.query("SELECT summoner_id FROM summoners WHERE last_current_mastery_update < now() - INTERVAL 22 HOUR OR last_current_mastery_update is NULL").then((result) => {
    console.log("got result");
    for (var i = 0; i < result.length; i++) {
      var currentSummoner = result[i].summoner_id;
      logger.info("Updating summoner: " + currentSummoner);
      updateSummonerMastery(currentSummoner);
    }
  }).catch((err) => {
    console.log(err);
  });
}

function updateSummonerMastery(summonerId) {
  logger.debug("Retrieving champion mastery.");
  League.ChampionMastery.getChampionMastery(summonerId).then((result) => {
      logger.debug("Building promise chain.");
      var chain = result.reduce((previousValue, currentValue) => {
        return previousValue.then(() => insertMastery(currentValue));
      }, Promise.resolve(true));
      return chain;
    }).then(() => {
      logger.debug("Setting last update time " + summonerId);
      return connection.query("UPDATE summoners SET last_current_mastery_update = now() WHERE summoner_id = ? ", [summonerId]);
    }).then(() => logger.info("Updated summoner: " + summonerId)).catch((err) => {
      logger.err(err);
    });
}

function insertMastery(entry) {
  logger.debug("Inserting mastery for " + entry.playerId + " / " + entry.championId);
  connection.query("INSERT INTO current_mastery (summoner_id , champion_id, mastery_level, pts_total, pts_next, pts_since, highest_grade, chest_granted) values (?, ?, ?, ?, ?, ?, ?, ?) ON duplicate key UPDATE  mastery_level = values(mastery_level), pts_total = values(pts_total), pts_next = values(pts_next), pts_since = values(pts_since), highest_grade = values(highest_grade)", [entry.playerId, entry.championId, entry.championLevel, entry.championPoints, entry.championPointsUntilNextLevel, entry.championPointsSinceLastLevel, entry.highestGrade, entry.chestGranted])
}
