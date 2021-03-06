process.env.NODE_CONFIG_DIR="../config/";
var mysql = require("promise-mysql");
var config = require("config");
var fs = require("fs");

var connection;

mysql.createConnection({
      host: config.get("database.host"),
      user: config.get("database.username"),
      password: config.get("database.password"),
      multipleStatements: true
    }).then((conn) => {
        connection = conn;
        // no errors for drop table
        return connection.query("DROP DATABASE " + config.get("database.name")).catch((err) => true);
    }).then(function() {
      return connection.query("CREATE DATABASE IF NOT EXISTS " + config.get("database.name"));
    }).then(() => {
      return connection.query("USE " + config.get("database.name"));
    }).then(() => {
        var exampleDB = null;
        if (process.argv[2] === "example") {
            exampleDB = fs.readFileSync("exampleDatabase.sql", "utf8");
        } else {
            exampleDB = fs.readFileSync("structure.sql", "utf8");
        }
      return connection.query(exampleDB);
    }).then((res) => {
      console.log("Finished importing sql. Your install is now ready.");
      process.exit(0);
    }).catch((err) => {
        console.log("ERROR", err);
        process.exit(1);
    });
