var mysql = require("promise-mysql");
var config = require("config");
var logger;
exports.CONNECTION;

// returns a promise<Boolean>, true if success, error otherwise
exports.init = function(log) {
  logger = log;
  return mysql.createConnection({
      host: config.get("database.host"),
      user: config.get("database.username"),
      password: config.get("database.password")
    }).then(function(conn) {
      exports.CONNECTION = conn;
      return conn.query("USE " + config.get("database.name"));
    }).then(() => {
      return true;
    });
}
