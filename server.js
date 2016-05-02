var express = require("express")
var bodyParser = require('body-parser');
var morgan = require("morgan")
var db = require("./database");
var config = require("config");
var util = require("./util");
var fs = require("fs");
var winston = require("winston");
var formatter = require("./formatter").formatter;
var WinstonContext = require("winston-context");
// use this to log here!
var serverLogger = new WinstonContext(winston, "[Server]");
var expressSession = require('express-session');
var League = require("./leaguejs/lolapi");
// set up winston logging to file & console
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
  filename: config.get("logfile"),
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
// no calls at all so far
// init League
//serverLogger.info("Initializing LeagueJS");
//League.init(process.env.API_KEY, process.env.API_REGION);
//League.setRateLimit(config.get("limitPer10s"), config.get("limitPer10min"));

// array containing available endpoints
var modules = [];

var app = express();
app.use(bodyParser.json({
  limit: '2kb',
  extended: true
}));
app.use(bodyParser.urlencoded({
  limit: '2kb',
  extended: true
}));
app.use(morgan('dev'));


// init client request stuff
db.init(new WinstonContext(winston, "[Database]"), config).then(() => {
  // load client side modules
  return loadModules();
}).then(() => {
  return listen();
}).catch((err) => {
  serverLogger.error("Failed to start server: " + err);
  process.exit(1);
})

function listen() {
  app.listen(config.get("port"), () => {
    serverLogger.info("Server running at http://127.0.0.1:" + config.get("port"));
  });
}

/**
 * Loads all modules from endpointsDir (@see config/default.json)
 * and initializes them with a mainObject containing:
 * - function to add APIEndpoints (endpoint, loginEndpoint, authenticatedEndpoint, validatedEndpoint)
 * - database connection
 * - config to retrive config information (@see config/default.json)
 * - logger instance with a module defined prefix ([Module module.name])
 */
function loadModules() {
  var mainObject = {
    addEndpoint: addEndpoint,
    database: db.CONNECTION,
    config: config,
    League: League,
    logger: null,
  }
  var files = fs.readdirSync(config.get("endpointsDir"))
  var promises = [];
  serverLogger.info("Started loading Endpoints: " + files.length);
  for (var i = 0; i < files.length; i++) {
    serverLogger.info("Loading module: " + files[i].replace(".js", ""))
    var modul = require(config.get("endpointsDir") + files[i].replace(".js", ""));
    modules.push({
      module: modul,
      name: modul.name,
      description: modul.description,
      loaded: true,
    });
    // init logger for module
    var moduleCtx = new WinstonContext(winston, "[Module " + modules[i].name +"]");
    mainObject.logger = moduleCtx;
    // init module
    modul.init(mainObject);
  }
  return Promise.resolve(true);
}

/**
 * adds an endpoint
 */
function addEndpoint(route, func) {
  app.post(route, func);
}
