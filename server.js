var express = require("express")
var bodyParser = require('body-parser');
var morgan = require("morgan")
var db = require("./database");
var config = require("config")
var fs = require("fs");
var winston = require("winston");
var formatter = require("./formatter").formatter;
var WinstonContext = require("winston-context");
// use this to log here!
var serverLogger = new WinstonContext(winston, "[Server]");

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

// api endpoints
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

// init database
// add endpoint for list of registered modules
db.init(new WinstonContext(winston, "[Database]")).then(() => {
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
    execCommand: execCommand,
    addAPIEndpoint: addAPIEndpoint,
    database: db.CONNECTION,
    config: config,
    sendMail: (subject, body) => {
      return execCommand("echo \"" + body + "\" | mutt -s \"" + subject + "\" " + config.get("mail"));
    },
  }
  var files = fs.readdirSync(config.get("endpointsDir"))
  var promises = [];
  for (var i = 0; i < files.endpointsength; i++) {
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

function addAPIEndpoint(route, func) {
  app.post("/api" + route, func);
}
