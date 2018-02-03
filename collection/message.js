var logger;
var League;
var dbPool;
var currentmastery;
exports.init = function(conn, log, leagJS, currentmastery_module) {
  dbPool = conn;
  logger = log;
  League = leagJS;
  currentmastery = currentmastery_module;
  logger.info("Initializing message")
  process.on("message", handleMessage);
}


function handleMessage(data) {
  logger.info("Handling Message");
  handleNewSummoner(data);
  // theoretically you can handle different types here
}


function handleNewSummoner(input) {
  var name = input.data;
  logger.info("Adding summoner: " + name);
  name = name.replace(/ /g, "").toLowerCase();
  var summonerId;
  var connection;
 dbPool.getConnection().then((conn) => {
    connection = conn;
    return connection.query("START TRANSACTION");
  }).then(() => {
    return League.Summoner.getByName(name);
  })
  .then((result) => {
    logger.info("Got summoner");
    summonerId = result[name].id;
    return connection.query("INSERT INTO summoners (summoner_id, summoner_name, summoner_icon) values (?, ?, ?)", [result[name].id, result[name].name, result[name].profileIconId]);
    }).then((res => {
    logger.info("Requesting Mastery for Current User with id: " + summonerId);
    return currentmastery.updateSummonerMastery(summonerId, connection);
  })).then((res) => {
    logger.info("Selecting rows for gains update");
    return connection.query("SELECT id as champion_id, case when mastery_level is null then 1 else mastery_level end as mastery_level, case when pts_total is null then 0 else pts_total end as pts_total, case when pts_since is null then 0 else pts_since end as pts_since, case when pts_next is null then 1800 else pts_next end as pts_next FROM  champions left join current_mastery on id = champion_id and summoner_id = ?;", [summonerId]);
  }).then((result) => {
    logger.info("Got Rows for Gains update");
    var promises = [];
    var queryString = "INSERT INTO gains (summoner_id, champion_id, game_id, game_timestamp, mastery_level, pts_gained, pts_next, pts_since, pts_total) VALUES ";
    for (var i = 0; i < result.length; i++) {
      queryString += "( " + summonerId + ", " + result[i].champion_id + ", NULL, now(), "+ result[i].mastery_level + ", NULL, " + result[i].pts_next + ", "+ result[i].pts_since + ", "+ result[i].pts_total +")";
      if (i < result.length -1) {
        queryString += ",";
      }
    }
    logger.info("Inserting rows into gains");
    return connection.query(queryString);
  }).then((res) => {
    return connection.query("COMMIT");
  }).then(() => {
    logger.info("Answering request to add new user.");
    process.send({workerId: input.workerId, summoner_id: summonerId, token: input.token, success: true});
    return true;
  }).catch((err) => {
    logger.warn(err);
    err = "" + err;
    if (err.indexOf("ER_DUP_ENTRY") !== -1) {
      console.log("sending dup")
      process.send({workerId: input.workerId, summoner_id: summonerId, token: input.token, success: true});
    } else {
      console.log("Sending failure");
      process.send({workerId: input.workerId, token: input.token, success: false, summonerExists: err.indexOf("404 Not Found") === -1});
    }
    return connection.query("ROLLBACK");
  }).then(() => {
    dbPool.releaseConnection(connection);
  });
}
