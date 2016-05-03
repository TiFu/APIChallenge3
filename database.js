var mysql = require("promise-mysql");
var logger;
exports.CONNECTION;

// returns a promise<Boolean>, true if success, error otherwise
exports.init = function(log, config) {
  logger = log;
  return mysql.createConnection({
      host: config.get("database.host"),
      user: config.get("database.username"),
      password: config.get("database.password")
    }).then(function(conn) {
      logger.info("Connected to database: " + config.get("database.host"));
      exports.CONNECTION = conn;
      return conn.query("USE " + config.get("database.name"));
    }).then(() => {
      logger.info("Using database " + config.get("database.name"));
      return true;
    });
}
