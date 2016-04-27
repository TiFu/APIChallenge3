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
// add endpoint for list of registered modules
db.init(new WinstonContext(winston, "[Database]")).then(() => {
  authentication.initPassportWithMysql(passport, db.CONNECTION); // init passport
  return loadModules();
}).then(() => {
  addAPIEndpoint("/modules", util.createEndpointFromFunc(() => Promise.resolve(modules.map((f) => {
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

function loadModules() {
  var mainObject = {
    addAPIEndpoint: addAPIEndpoint,
    addLoginEndpoint: addLoginEndpoint,
    database: db.CONNECTION,
    config: config,
    passport: passport,
    League: League,
  }
  var files = fs.readdirSync(config.get("endpointsDir"))
  var promises = [];
  serverLogger.info("Start loading modules: " + files.length);
  for (var i = 0; i < files.length; i++) {
    serverLogger.info("Loading module: " + files[i].replace(".js", ""))
    var modul = require(config.get("endpointsDir") + files[i].replace(".js", ""));
    modules.push({
      module: modul,
      name: modul.name,
      description: modul.description,
      loaded: false,
      reason: modul.reason
    });
    // race condition
    (function(i) {
      var moduleCtx = new WinstonContext(winston, "[Module " + modules[i].name +"]");
      mainObject.logger = moduleCtx;
      promises.push(modul.init(mainObject).then((success) => {
        if (!success) {
          moduleCtx.warn("Failed to init module. " + modules[i].reason);
        }
        modules[i].loaded = success;
        modules[i].reason = modules[i].module.reason;
      }))
    }(i));
  }
  return Promise.all(promises);
}

// if an endpoint should only be available to logged in users
function addAuthenticatedEndpoint(route, func) {
  app.post("/api" + route, (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).send("Unauthorized");
    }
  })
}

// endpoint only for logging in!
function addLoginEndpoint(route, func) {
    app.post("/api" + route, passport.authenticate("local"), func);
}
function addAPIEndpoint(route, func) {
  app.post("/api" + route, func);
}
