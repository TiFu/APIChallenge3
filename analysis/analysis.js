var mysql = require("promise-mysql");

var connection = null; // todo db connection
var League = null; // league request
var games = [];


var League = require("../leaguejs/lolapi");
// init League
League.init(process.env.API_KEY, process.env.API_REGION);
League.setRateLimit(8, 400);

// MOCK getMatch Endpoint for testing purposes
League.getMatch = (gameId, timeline) =>{
  return Promise.resolve({matchCreation: gameId, matchDuration: 70});
}
// execute
initDB().then(() => {
  processEntries();
})

function initDB() {
  return mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "root"
    }).then(function(conn) {
      connection = conn;
      return conn.query("use datacollection");
    });
}

function processEntries() {
    return connection.query("SELECT * FROM mastery WHERE processed = 0 ORDER BY update_time ASC").then((result) => {
      if (result.length > 0) {
        // construct promise chain so entries get processed in the correct order
        var chain = result.reduce((previous, item, index) => {
           return previous.then(() => {
             console.log(index);
            return processEntry(item);
           });
        }, Promise.resolve(true));

        console.log("returning last promise");
        return chain;
      } else {
        console.log("nothing to process");
        return "Nothing to process";
      }
    }).then((res) => {
      games = [];
      return true;
    }).catch((err) => {
      console.log("Error Processing: ", err);
      return false;
    });
}


function processEntry(masteryEntry) {
   return connection.query("SELECT * FROM mastery WHERE summoner_id = ? and champion_id = ? and update_time < ? ORDER BY update_time DESC LIMIT 1", [masteryEntry.summoner_id, masteryEntry.champion_id, masteryEntry.update_time]).then((result) => {
      if (!result || result.length == 0) {
        console.log("first entry");
        return createFirstEntry(masteryEntry);
      } else {
        console.log("second entry");
        return createEntry(masteryEntry, result[0]);
      }
   }).then(() => {
     console.log("setting processed bit");
     return connection.query("UPDATE mastery SET processed = 1 WHERE summoner_id = ? and game_id = ?", [masteryEntry.summoner_id, masteryEntry.game_id]);
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
    masteryEntry.timestamp = game.matchCreation + game.matchDuration;
    masteryEntry.pts_gained = null;
    return insertGains(masteryEntry);
  });
}

function createEntry(masteryEntry, lastEntry) {
  return getGame(masteryEntry.game_id).then((game) => {
    masteryEntry.timestamp = game.matchCreation + game.matchDuration;
    masteryEntry.pts_gained = masteryEntry.championPoints - lastEntry.championPoints; // difference before after
    return insertGains(masteryEntry);
  });
}

function insertGains(masteryEntry) {
  return connection.query("INSERT INTO gains (summoner_id, champion_id, game_id, game_timestamp, pts_gained, mastery_level, pts_next, pts_since, pts_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [masteryEntry.summoner_id, masteryEntry.champion_id, masteryEntry.game_id, masteryEntry.game_timestamp, masteryEntry.pts_gained, masteryEntry.championLevel, masteryEntry.pointsSinceLastLevel, masteryEntry.pointsUntilNextLevel, masteryEntry.championPoints]);
}
