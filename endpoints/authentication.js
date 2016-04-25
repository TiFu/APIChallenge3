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
  res.status(200).send({"success": true});
}

function isLoggedInEndpoint(req, res) {
  res.status(200).send({"loggedIn": req.isAuthenticated(), "user": req.user});
}

function registerEndpoint(req, res) {
    if (!req.body.username || !req.body.password || req.body.username.length <= config.get("min-username-length") || req.body.password.length < config.get("min-password-length")) {
      console.log("invalid settings");
      res.status(200).send({
        success: false,
        msg: "INVALID_SETTINGS"
      });
    } else {
      console.log("registering user");
      authentication.registerUser(req.body.username, req.body.password, mainApp.database).then((success) => {
        res.status(200).send({
          "success": success,
          "msg": success ? "" : "REGISTER_FAILED"
        });
      });
    }
}
