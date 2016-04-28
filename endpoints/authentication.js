var config = require("config");
var authentication = require("../authentication");
var randomstring = require("randomstring");

exports.name = "Authentication";
exports.description = "Authentication Endpoints";
exports.reason = undefined;
var mainApp;

exports.init = (main) => {
  mainApp = main;
  /* TODO add auth endpoint
    * authenticate table with id, string
    * authReady retrieves rune page, checks for correct string, removes auth, sets auth bit
  */
  main.addAPIEndpoint("/auth/register", registerEndpoint);
  main.addLoginEndpoint("/auth/login", loginEndpoint);
  main.addAPIEndpoint("/auth/isLoggedIn", isLoggedInEndpoint);
  main.addAPIEndpoint("/auth/logout", logoutEndpoint);
  main.addAuthenticatedEndpoint("/auth/getAuthString", getAuthStringEndpoint);
  main.addAuthenticatedEndpoint("/auth/authenticate", authenticateEndpoint);
}

function getAuthStringEndpoint(req, res) {
    var string = randomstring.generate(50);
    mainApp.database.query("SELECT authkey FROM " +  mainApp.config.get("database.tables.authentication") + " WHERE user_id = ? LIMIT 1", [req.user.id]).then((rows) => {
      if (rows.length == 0) { // if no record exists
        return mainApp.database.query("INSERT INTO " + mainApp.config.get("database.tables.authentication") + " (user_id, authkey) VALUES (?, ?)", [req.user.id, string]);
      } else { // record exists
        res.status(200).send({success: true, msg: rows[0]["authkey"]});
        return null;
      }
    }).then((result) => {
      res.status(200).send({success: true, msg: string});
    }).catch((err) => {
      res.status(200).send({success: false, msg: "FAILED_SAFE"});
    })
}

function authenticateEndpoint(req, res) {
  // retrieve user info
  var key = "";
  mainApp.database.query("SELECT authkey FROM " + mainApp.config.get("database.tables.authentication") + " WHERE user_id = ? LIMIT 1", [req.user.id]).then((row) => {
    if (row.length != 1) {
      throw new Error("NO_KEY");
    }
    return row[0]["authkey"];
  }).then((authkey) => {
    key = authkey;
    return mainApp.League.Summoner.getRunes(req.user.summoner_id, req.user.region)
  }).then((runes) => {
    return (runes[req.user.summoner_id].pages.filter(e => e.name === key).length > 0);
  }).then((result) => {
    if (!result) {
      throw new Error("KEY_NOT_FOUND");
    }
    return mainApp.database.query("UPDATE " + mainApp.config.get("database.tables.users") + " SET validated = 1 WHERE id = ?", [req.user.id]);
  }).then((r) => {
    res.status(200).send({success: true});
    return mainApp.database.query("DELETE FROM " + mainApp.config.get("database.tables.authentication") + " WHERE user_id = ?", [req.user.id]);
  }).catch((err) => {
    res.status(200).send({success: false, msg: err});
  });
}
function logoutEndpoint(req, res) {
    req.logout();
    res.status(200).send({success: true});
}

function loginEndpoint(req, res) {
  // see above! uses addLoginEndpoint
  res.status(200).send({"success": true});
}

function isLoggedInEndpoint(req, res) {
  res.status(200).send({"loggedIn": req.isAuthenticated(), "user": req.user});
}

function registerEndpoint(req, res) {
    if (!req.body.username || !req.body.password || req.body.username.length <= config.get("min-username-length") || req.body.password.length < config.get("min-password-length") || !req.body.summoner || !req.body.region) {
      res.status(200).send({
        success: false,
        msg: "INVALID_SETTINGS"
      });
    } else {
      // check region
      mainApp.League.getRegions().then((regions) => {
        if (!regions[req.body.region]) {
          throw new Error("UNKNOWN_REGION");
        }

        return mainApp.League.Summoner.getByName(req.body.summoner, req.body.region);
      }).then((result) => {
        console.log(result);
        // TODO which ones need to be replaced
        var summonerId = result[req.body.summoner.toLowerCase().replace(" ", "")].id;
        return authentication.registerUser(req.body.username, req.body.password, summonerId, req.body.region, mainApp.database);
      })
      .then((success) => {
        res.status(200).send({
          "success": success,
          "msg": success ? "" : "REGISTER_FAILED"
        });
      }).catch((err) => {
        res.status(200).send({"success": false, "msg": err});
      });
    }
}
