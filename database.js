var mysql = require("promise-mysql");
var logger;
exports.CONNECTION;
exports.POOL;

// returns a promise<Boolean>, true if success, error otherwise
exports.init = function(log, config) {
  logger = log;
  var host = process.env.OPENSHIFT_MYSQL_DB_HOST ? process.env.OPENSHIFT_MYSQL_DB_HOST : config.get("database.host");
  var port =  process.env.OPENSHIFT_MYSQL_DB_PORT ? process.env.OPENSHIFT_MYSQL_DB_PORT : 3306;
  var user = process.env.OPENSHIFT_MYSQL_DB_USERNAME ? process.env.OPENSHIFT_MYSQL_DB_USERNAME : config.get("database.username");
  var password = process.env.OPENSHIFT_MYSQL_DB_PASSWORD ? process.env.OPENSHIFT_MYSQL_DB_PASSWORD : config.get("database.password");
  exports.CONNECTION =  mysql.createPool({
      database: config.get("database.name"),
      host: host,
      port: port,
      user: user,
      password: password
    });
  exports.POOL = exports.CONNECTION;
  exports.POOL.on('connection', function (connection) {
    connection.query('use ' + config.get("database.name"))
  });
  return Promise.resolve(true);
}
