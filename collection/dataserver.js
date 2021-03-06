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
var message = require("./message");
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

// init data collection & analysis.
db.init(new WinstonContext(winston, "[Database] "), config).then(() => {
  serverLogger.info("Starting collection services");
    datacollection.init(db.CONNECTION, new WinstonContext(winston, "[Collection] "), League);
    analysis.init(db.CONNECTION, new WinstonContext(winston, "[Analysis] "), League);
    currentmastery.init(db.CONNECTION, new WinstonContext(winston, "[Current Mastery] "), League);
    staticdata.init(db.CONNECTION, new WinstonContext(winston, "[Static Data] "), League);
    message.init(db.CONNECTION, new WinstonContext(winston, "[Message]"), League, currentmastery);
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
