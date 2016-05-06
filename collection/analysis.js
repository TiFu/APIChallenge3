var connection = null;
var logger = null;
var League = null;
var games = [];
exports.init = function(conn, log, leagJS) {
  connection = conn;
  logger = log;
  League = leagJS;

  setInterval(() => {
    processEntries();
  }, 60*60*1000); // check every 24 hours.
  processEntries();
}


function processEntries() {
    return connection.query("SELECT * FROM mastery WHERE processed = 0 ORDER BY update_time ASC").then((result) => {
      logger.info("Analysing games.");
      if (result.length > 0) {
        // construct promise chain so entries get processed in the correct order
        var chain = result.reduce((previous, item, index) => {
           return previous.then(() => {
            return processEntry(item);
           });
        }, Promise.resolve(true));
        return chain;
      } else {
        logger.debug("No new games detected.");
        return "Nothing to process";
      }
    }).then((res) => {
      logger.info("Finished analysing games.");
      // clear game cache after run. we won't see those games ever again
      games = [];
      return true;
    }).catch((err) => {
      logger.error(err);
      logger.error("Error processing new games.", err);
      return false;
    });
}


function processEntry(masteryEntry) {
  // select last entry with that champion
  logger.info("Processing entry " + masteryEntry.summoner_id + " / "  + masteryEntry.game_id);
   return connection.query("SELECT * FROM mastery WHERE summoner_id = ? and champion_id = ? and update_time < ? ORDER BY update_time DESC LIMIT 1", [masteryEntry.summoner_id, masteryEntry.champion_id, masteryEntry.update_time]).then((result) => {
      if (!result || result.length == 0) {
        logger.debug("First entry for " + masteryEntry.summoner_id + " and " + masteryEntry.champion_id);
        return createFirstEntry(masteryEntry);
      } else {
        logger.debug("At least 1 entry for " + masteryEntry.summoner_id + " and " + masteryEntry.champion_id + " exists.");
        return createEntry(masteryEntry, result[0]);
      }
   }).then(() => {
     logger.debug("Setting processed bit for " + masteryEntry.summoner_id + " and " + masteryEntry.game_id + ".");
     return connection.query("UPDATE mastery SET processed = 1 WHERE summoner_id = ? and game_id = ?", [masteryEntry.summoner_id, masteryEntry.game_id]);
   }).then(() => {
     logger.info ("Finished processing " + masteryEntry.summoner_id + " / "  + masteryEntry.game_id);
   })
}

function getGame(gameId) {
  if (games["" + gameId]) {
    return Promise.resolve(games["" + gameId]);
  } else {
    return League.getMatch(gameId, false).then((game) => {
      games["" + gameId] = game;
      return game;
    })
  }
}

function createFirstEntry(masteryEntry) {
  return getGame(masteryEntry.game_id).then((game) => {
    masteryEntry.timestamp = Math.floor((game.matchCreation + game.matchDuration) / 1000.0);
    masteryEntry.pts_gained = null;
    return insertGains(masteryEntry);
  });
}

function createEntry(masteryEntry, lastEntry) {
  return getGame(masteryEntry.game_id).then((game) => {
    masteryEntry.timestamp = Math.floor((game.matchCreation + game.matchDuration) / 1000.0);
    masteryEntry.pts_gained = masteryEntry.championPoints - lastEntry.championPoints; // difference before after
    return insertGains(masteryEntry);
  });
}

function insertGains(masteryEntry) {
  logger.debug("Inserting mastery entry.", masteryEntry);
  return connection.query("INSERT INTO gains (summoner_id, champion_id, game_id, game_timestamp, pts_gained, mastery_level, pts_next, pts_since, pts_total) VALUES (?, ?, ?, FROM_UNIXTIME(?), ?, ?, ?, ?, ?)", [masteryEntry.summoner_id, masteryEntry.champion_id, masteryEntry.game_id, masteryEntry.timestamp, masteryEntry.pts_gained, masteryEntry.championLevel, masteryEntry.pointsSinceLastLevel, masteryEntry.pointsUntilNextLevel, masteryEntry.championPoints]);
}
