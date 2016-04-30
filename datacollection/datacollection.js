var mysql = require("promise-mysql");
var connection;

var League = require("../leaguejs/lolapi");
var NUMBER_OF_PLAYERS = 200;

console.log("API KEY: ", process.env.API_KEY);
console.log("API REGION:", process.env.API_REGION);
// init League
League.init(process.env.API_KEY, process.env.API_REGION);
League.setRateLimit(10, 500);

initDB = function() {
  return mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "root"
    }).then(function(conn) {
      connection = conn;
      return createDatabase();
    }).then(createUsersTable).then(createMasteryTable);
}

function createDatabase() {
  console.log("Creating Database");
  return connection.query("CREATE DATABASE IF NOT EXISTS datacollection").then(() => connection.query("USE datacollection"));
}

function createUsersTable() {
  console.log("Creating Summoners Table");
  return connection.query("CREATE TABLE IF NOT EXISTS  summoners (summoner_id bigint not null, summoner_name varchar(100), update_time TIMESTAMP NULL DEFAULT NULL, primary key(summoner_id))");
}

function createMasteryTable() {
  console.log("Creating Mastery Table");
  return connection.query("CREATE TABLE IF NOT EXISTS mastery (summoner_id bigint, champion_id bigint, game_id bigint, update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, championLevel int, championPoints bigint, pointsSinceLastLevel bigint, pointsUntilNextLevel bigint, UNIQUE(summoner_id, game_id))")
}

function checkData() {
  console.log("checking data");
  return connection.query("SELECT summoner_id FROM summoners").then((result) => {
    for (var i = 0; i < result.length; i++) {
      updateSummoner(result[i].summoner_id);
    }
  })

}

function updateSummoner(summoner_id) {
  console.log("Updating summoner: " + summoner_id);
  var gameId = null;
  var options =  {rankedQueues: ["TEAM_BUILDER_DRAFT_RANKED_5x5"], beginIndex: 0, endIndex: 1};
  // TODO check if gameId is already in table with that summoner id => if yes no new game (vllt unique summoner_id und gameId, fliegt halt nen fehler aber w/e)
  League.getMatchHistory(summoner_id, options).then((result) => {
    console.log("Got Match History");
    if (result.matches == undefined || result.matches.length == 0) {
      return Promise.resolve(true);
    } else if (result.matches.length == 1) {
      gameId = result.matches[0].matchId;
      console.log("Getting Champion Mastery");
      return League.ChampionMastery.getChampionMastery(summoner_id, result.matches[0].champion);
    }
  }).then((result) => {
    if (result === true) {
      return Promise.resolve(true);
    } else if (result) {
      console.log("got mastery");
      return insertMasteryUpdate(summoner_id, result, gameId).catch((err) => true);
    }
  }).then(() => {
    console.log("Created game: " + summoner_id);
    return connection.query("UPDATE summoners SET update_time = now() WHERE summoner_id = " + summoner_id);
  }).catch((err) => {
    console.log("Error fetching infos for " + summoner_id + ": ", err);
    return Promise.resolve(false);
  })

}
function insertMasteryUpdate(summonerId, mastery, gameId) {
  return connection.query("INSERT INTO mastery (summoner_id, champion_id, game_id, championLevel, championPoints, pointsSinceLastLevel, pointsUntilNextLevel) VALUES (" + summonerId + "," + mastery.championId + ", " + gameId + ", " + mastery.championLevel + "," + mastery.championPoints + "," + mastery.championPointsSinceLastLevel + "," + mastery.championPointsUntilNextLevel + ")")
}

function initChallengers() {
  return League.getChallengerData().then((result) => {
    console.log("inserting challengers");
    var insert = "INSERT INTO summoners (summoner_id, summoner_name) VALUES ";
    for (var i = 0; i < NUMBER_OF_PLAYERS; i++) {
      insert += "(" + result.entries[i].playerOrTeamId + ", '" +result.entries[i].playerOrTeamName + "')";
      if (i < NUMBER_OF_PLAYERS-1) {
        insert +=","
      } else {
        insert += ";"
      }
    }
    return connection.query(insert);
  });
}

initDB().then(() => {
  console.log("selecting count");
  return connection.query("SELECT COUNT(*) as cnt FROM summoners");
}).then((result) => {
  console.log(result);
  if (result[0].cnt < NUMBER_OF_PLAYERS) {
    console.log("Loading Challengers");
    return initChallengers().catch((err) => console.log(err, "Continuing"));
  } else {
    console.log("Challengers present");
    return Promise.resolve(true);
  }
}).then(() => {
  checkData();
}).catch((err) => {
  console.log(err);
});

setInterval(() => {
  checkData();
}, 20*60*1000); // check every 20 minutes.
