var mysql = require("promise-mysql");
var config = require("config");
var logger;
exports.CONNECTION;

// returns a promise<Boolean>, true if success, false otherwise
exports.init = function(log) {
  logger = log;
  return mysql.createConnection({
    host: config.get("database.host"),
    user: config.get("database.username"),
    password: config.get("database.password")
  }).then(function(conn) {
    exports.CONNECTION = conn;
    return createDatabase();
  });
}

// TODO pool connections?
function createDatabase() {
  return exports.CONNECTION.query("CREATE DATABASE IF NOT EXISTS " + config.get("database.name")).then(() => {
    logger.info("Created Database " + config.get("database.name"));
    return exports.CONNECTION.query("USE " + config.get("database.name"));
  }).then(() => {
    logger.info("Using Database " + config.get("database.name"));
    return true;
  })
}
