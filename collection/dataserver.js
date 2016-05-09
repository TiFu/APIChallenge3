var config = require("config");
var winston = require("winston");
var formatter = require("../formatter").formatter;
var WinstonContext = require("winston-context");
var League = require("./leaguejs/lolapi");
var datacollection = require("./datacollection");
var analysis = require("./analysis");
var db = require("../database");
var currentmastery = require("./currentmastery");
var staticdata = require("./staticdata.js");
// use this to log here!
var serverLogger = new WinstonContext(winston, "[Server]");

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  handleException: true,
  humanReadableUnhandledException: true,
  exitOnError: false,
  formatter: formatter,
  json: false,
  colorize: true,
});
winston.add(winston.transports.File, {
  filename: config.get("datalogfile"),
  handleException: true,
  humanReadableUnhandledException: true,
  exitOnError: false,
  formatter: formatter,
  json: false,
});

if (!process.env.API_KEY || !process.env.API_REGION) {
  serverLogger.error("API-Key or API Region not found! Please set API_KEY and API_REGION as environment variables and configure your rate limit in config/default.json.");
  process.exit(1);
}



serverLogger.info("Initializing LeagueJS");
League.init(process.env.API_KEY, process.env.API_REGION);
League.setRateLimit(config.get("limitPer10s"), config.get("limitPer10min"));

exports.handleNewSummoner = (input) => {
  var name = input.data;
  serverLogger.info("Adding summoner: " + name);
  name = name.replace(/ /g, "").toLowerCase();
  var summonerId;
  var connection;
  db.POOL.getConnection().then((conn) => {
    connection = conn;
    return connection.query("START TRANSACTION");
  }).then(() => {
    return League.Summoner.getByName(name);
  })
  .then((result) => {
    serverLogger.info("Got summoner");
    console.log(result);
    console.log("looking up with: " + name);
    summonerId = result[name].id;
    return connection.query("INSERT INTO summoners (summoner_id, summoner_name, summoner_icon) values (?, ?, ?)", [result[name].id, result[name].name, result[name].profileIconId]);
    }).then((res => {
    serverLogger.info("Requesting Mastery for Current User with id: " + summonerId);
    return currentmastery.updateSummonerMastery(summonerId, connection);
  })).then((res) => {
    serverLogger.info("Selecting rows for gains update");
    return connection.query("SELECT id as champion_id, case when mastery_level is null then 1 else mastery_level end as mastery_level, case when pts_total is null then 0 else pts_total end as pts_total, case when pts_since is null then 0 else pts_since end as pts_since, case when pts_next is null then 1800 else pts_next end as pts_next FROM  champions left join current_mastery on id = champion_id and summoner_id = ?;", [summonerId]);
  }).then((result) => {
    serverLogger.info("Got Rows for Gains update");
    var promises = [];
    var queryString = "INSERT INTO gains (summoner_id, champion_id, game_id, game_timestamp, mastery_level, pts_gained, pts_next, pts_since, pts_total) VALUES ";
    for (var i = 0; i < result.length; i++) {
      queryString += "( " + summonerId + ", " + result[i].champion_id + ", NULL, now(), "+ result[i].mastery_level + ", NULL, " + result[i].pts_next + ", "+ result[i].pts_since + ", "+ result[i].pts_total +")";
      if (i < result.length -1) {
        queryString += ",";
      }
    }
    serverLogger.info("Inserting rows into gains");
    return connection.query(queryString);
  }).then((res) => {
    return connection.query("COMMIT");
  }).then(() => {
    serverLogger.info("Answering request to add new user.");
    process.send({workerId: input.workerId, summoner_id: summonerId, token: input.token, success: true});
  }).catch((err) => {
    serverLogger.warn(err);
    connection.query("ROLLBACK").then(() => {
      db.POOL.releaseConnection(connection);
    }).catch((err2) => {
      serverLogger.error(err2);
    })

    err = "" + err;
    if (err.indexOf("ER_DUP_ENTRY") !== -1) {
      process.send({workerId: input.workerId, summoner_id: summonerId, token: input.token, success: true});
    } else {
      process.send({workerId: input.workerId, token: input.token, success: false, summonerExists: err.indexOf("404 Not Found") === -1});
    }
  });
}

// init data collection & analysis.
db.init(new WinstonContext(winston, "[Database] "), config).then(() => {
  serverLogger.info("Starting collection services");
    datacollection.init(db.CONNECTION, new WinstonContext(winston, "[Collection] "), League);
    analysis.init(db.CONNECTION, new WinstonContext(winston, "[Analysis] "), League);
    currentmastery.init(db.CONNECTION, new WinstonContext(winston, "[Current Mastery] "), League);
    staticdata.init(db.CONNECTION, new WinstonContext(winston, "[Static Data] "), League);
    if (process.argv.indexOf("no-collection") === -1) {
        datacollection.start();
        analysis.start();
        currentmastery.start();
        staticdata.start();
    }
}).catch((err) => {
  serverLogger.warn(err);
  process.exit(1);
});
