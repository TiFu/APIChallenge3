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
    }).then(createUsersTable).then(createAuthTable);
}

function createDatabase() {
  return exports.CONNECTION.query("CREATE DATABASE IF NOT EXISTS " + config.get("database.name")).then(() => {
    logger.info("Created Database " + config.get("database.name"));
    return exports.CONNECTION.query("USE " + config.get("database.name"));
  }).then(() => {
    logger.info("Using Database " + config.get("database.name"));
    return true;
  })
}


// TODO unique index for username, summoner_name, region! (maybe change and allow multiple summoners per user)
function createUsersTable() {
  return exports.CONNECTION.query("CREATE TABLE IF NOT EXISTS " + config.get("database.tables.users") + " (id int NOT NULL AUTO_INCREMENT, username varchar(25) NOT NULL, password BINARY(60) NOT NULL,summoner_id int, region varchar(3), authenticated boolean default false, PRIMARY KEY(id), CONSTRAINT unique_username UNIQUE(username))").then((res) => {
    logger.info("Created Table " + config.get("database.tables.users"));
  })
}

function createAuthTable() {
  return exports.CONNECTION.query("CREATE TABLE IF NOT EXISTS " + config.get("database.tables.authentication") + " (user_id int NOT NULL, authkey varchar(100) NOT NULL, PRIMARY KEY(user_id, authkey), CONSTRAINT unique_user UNIQUE(user_id), FOREIGN KEY(user_id) REFERENCES users(id))").then((res) => {
    logger.info("Created Table " + config.get("database.tables.authentication"));
  })
}
