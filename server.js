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
var passport = require('passport');
var expressSession = require('express-session');
var authentication = require("./authentication")
var League = require("./leaguejs/lolapi");

// init League
League.init(process.env.API_KEY, process.env.API_REGION);
League.setRateLimit(config.get("limitPer10s"), config.get("limitPer10min"));

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
// add session
app.use(expressSession({secret: 'iae45iae45iae45', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

// init database
// add endpoint for list of registered apiEndpoints
db.init(new WinstonContext(winston, "[Database]")).then(() => {
  authentication.initPassportWithMysql(passport, db.CONNECTION); // init passport
  return loadModules();
}).then(() => {
  addAPIEndpoint("/modules", util.createEndpointFromFunc(() => Promise.resolve(apiEndpoints.map((f) => {
    return {
      "name": f.name,
      "description": f.description,
      "loaded": f.loaded,
      "reason": f.reason ? f.reason : ""
    };
  }))));
  listen();
}).catch((err) => {
  serverLogger.error("Failed to start server: " + err);
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
    addAPIEndpoint: addAPIEndpoint,
    addLoginEndpoint: addLoginEndpoint,
    addAuthenticatedEndpoint: addAuthenticatedEndpoint,
    addValidatedEndpoint: addValidatedEndpoint,
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
 * Adds an endpoint at /api/route which only validated & authenticated users
 * can access.
 * @param route route string
 * @param func (req, res, next) => {do stuff}
 */
function addValidatedEndpoint(route, func) {
  addAuthenticatedEndpoint(route, (req, res, next) => {
    if (!req.user.validated) {
      res.status(401).send("Unauthorized");
    } else {
      func(req, res, next);
    }
  });
}

/**
 * add an endpoint only accessible by logged in users
 */
function addAuthenticatedEndpoint(route, func) {
  app.post("/api" + route, (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).send("Unauthorized");
    }
  }, func);
}

/**
 * endpoint for logging in (needs passport.authenticate)
 */
function addLoginEndpoint(route, func) {
    app.post("/api" + route, passport.authenticate("local"), func);
}

/**
 * adds an api endpoint accessible by everyone
 */
function addAPIEndpoint(route, func) {
  app.post("/api" + route, func);
}
