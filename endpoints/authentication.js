var config = require("config");
var authentication = require("../authentication");
exports.name = "Authentication";
exports.description = "Authentication Endpoint";
exports.reason = undefined;
var mainApp;

exports.init = (main) => {
  mainApp = main;
  main.addAPIEndpoint("/auth/register", registerEndpoint);
  main.addLoginEndpoint("/auth/login", loginEndpoint);
  main.addAPIEndpoint("/auth/isLoggedIn", isLoggedInEndpoint);
  main.addAPIEndpoint("/auth/logout", logoutEndpoint);
  return Promise.resolve(true);
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
