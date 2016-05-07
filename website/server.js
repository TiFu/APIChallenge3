var express = require("express")
var bodyParser = require('body-parser');
var morgan = require("morgan")
var db = require("../database");
var config = require("config");
var util = require("./util");
var fs = require("fs");
var winston = require("winston");
var formatter = require("../formatter").formatter;
var WinstonContext = require("winston-context");
var path = require('path');
// use this to log here!
var serverLogger = new WinstonContext(winston, "[Server]");
var expressSession = require('express-session');
var cors = require("cors");

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
app.use(cors());
app.use(express.static(path.join(__dirname, '/frontend')))

// init client request stuff
db.init(new WinstonContext(winston, "[Database]"), config).then(() => {
  // load client side modules
  return loadModules();
}).then(() => {
  addGetEndpoint("/health", (req, res, next) => res.status(200).send(""));
  addGetEndpoint("/info/poll", (req, res, next) => res.status(200).send(""));
  return listen();
}).catch((err) => {
  serverLogger.error("Failed to start server: " + err);
  process.exit(1);
})

function listen() {
  var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
  var port = process.env.OPENSHIFT_NODEJS_PORT || config.get("port");
  app.listen(port, ipaddress, () => {
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
  var files = fs.readdirSync("./website/" + config.get("endpointsDir"))
  var promises = [];
  serverLogger.info("Started loading Endpoints: " + files.length);
  for (var i = 0; i < files.length; i++) {
    serverLogger.info("Loading module: " + files[i].replace(".js", ""))
    var modul = require("./" + config.get("endpointsDir") + files[i].replace(".js", ""));
    modules.push({
      module: modul,
      name: modul.name,
      description: modul.description,
      loaded: true,
    });
    // init logger for module
    var moduleCtx = new WinstonContext(winston, "[Module " + modul.name +"]");
    serverLogger.info("Initialized Winston Context with name: " + modul.name);
    var localMainObject = { releaseConnection: releaseConnection, logger: moduleCtx, addEndpoint: addEndpoint,
        config: config,
        addGetEndpoint: addGetEndpoint};
    // init module
    modul.init(localMainObject);
  }
  return Promise.resolve(true);
}

function releaseConnection(connection) {
  return db.POOL.releaseConnection(connection);
}
/**
 * adds an endpoint
 */
function addEndpoint(route, func) {
  app.post(route, (req, res, next) => {
    db.POOL.getConnection().then((conn) => {
      serverLogger.info("Created connection");
      func(req, res, next, conn);
    })
  });
}

/**
 * adds an endpoint
 */
function addGetEndpoint(route, func) {
  app.get(route, (req, res, next) => {
    db.POOL.getConnection().then((conn) => {
      serverLogger.info("Created connection");
      func(req, res, next, conn);
    })
  });
}
