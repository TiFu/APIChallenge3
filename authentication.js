var bcrypt = require("bcrypt-nodejs")
var randomstring = require("randomstring");
var LocalStrategy = require('passport-local').Strategy;

exports.initPassportWithMysql = function(passport, con) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  })

  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    con.query("select id, username, summoner_id, region, authenticated from users where id = " + id).then((rows) => {
      done(null, rows[0]);
    });
  });

  passport.use("local", new LocalStrategy({
    usernameField: "username",
    passwordField: "password"
  }, (username, password, done) => {
    con.query("SELECT id, username, password FROM users WHERE username = ?", username).then((rows) => {
      if (!rows.length) {
        done("Invalid password or username.");
      } else {
        if (checkPassword(password, rows[0].password)) {
          done(null, rows[0]);
        } else {
          done("Invalid password or username.");
        }
      }
    }).catch((err) => {
      // TODO log err
      console.log(err);
      done("Ups. Something went wrong.");
    })
  }));
}


// Returns true if registration was successfull
// expects a unique index on username!
exports.registerUser = (username, password, summonerId, region, conn) => {
  var hashedPW = hashPassword(password);
  return conn.query("INSERT INTO users (username, password, summoner_id, region) VALUES (?, ?, ?, ?)", [username, hashedPW, summonerId, region]).then((res) => {
      return true;
  }).catch((err) => {
      console.log("Error inserting user: " + err);
      return false;
  });
}

function hashPassword(password) {
  var hash = bcrypt.hashSync(password);
  return hash;
}

function checkPassword(isPassword, expectedPassword) {
  return bcrypt.compareSync(isPassword, ""+ expectedPassword);
}
