var mysql = require("promise-mysql");
var logger;
exports.CONNECTION;

// returns a promise<Boolean>, true if success, error otherwise
exports.init = function(log, config) {
  logger = log;
  var host = process.env.OPENSHIFT_MYSQL_DB_HOST ? process.env.OPENSHIFT_MYSQL_DB_HOST : config.get("database.host");
  var port =  process.env.OPENSHIFT_MYSQL_DB_PORT ? process.env.OPENSHIFT_MYSQL_DB_PORT : 3306;
  var user = process.env.OPENSHIFT_MYSQL_DB_USERNAME ? process.env.OPENSHIFT_MYSQL_DB_USERNAME : config.get("database.username");
  var password = process.env.OPENSHIFT_MYSQL_DB_PASSWORD ? process.env.OPENSHIFT_MYSQL_DB_PASSWORD : config.get("database.password");
  return mysql.createConnection({
      host: host,
      port: port,
      user: user,
      password: password
    }).then(function(conn) {
      logger.info("Connected to database: " + host);
      exports.CONNECTION = conn;
      return conn.query("USE " + config.get("database.name"));
    }).then(() => {
      logger.info("Using database " + config.get("database.name"));
      return true;
    });
}
