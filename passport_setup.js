var bcrypt = require("bcrypt-nodejs")
var randomstring = require("randomstring");

exports.initPassportWithMysql = function(passport, con) {
  passport.serializeUser((user, done) => {
    done((null, user.id));
  })

  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    con.query("select * from users where id = " + id).then((rows) => {
      done(null, rows[0]);
    });
  });

  passport.use("local", new LocalStrategy({
    usernameField: "summoner_name",
    passwordField: "password"
  }, (summoner_name, password, done) => {
    con.query("SELECT id, summoner_name, password, salt FROM users WHERE summoner_name = '?'", summoner_name).then((rows) => {
      if (!rows.length) {
        done("Invalid password or username.");
      } else {
        if (checkPassword(password, rows[0].salt rows[0].password)) {
          done(null, rows[0]);
        } else {
          done("Invalid password or username.");
        }
      }
    }).catch((err) => {
      // TODO log err
      done("Ups. Something went wrong.");
    })
  }));
}


// Returns true if registration was successfull
// expects a unique index on summoner_name!
exports.registerUser = function(summoner_name, password, conn) => {
  var hashedPWObj = hashPassword(password);
  return conn.query("INSERT INTO users (summoner_name, password, salt) VALUES (?, ?, ?)", [summoner_name, hashedPWObj.password, hashedPWObj.salt]).then((res) => {
      return true;
  }).catch((err) => {
      return false;
  });
}

function hashPassword(password) {
    var salt = randomstring.generate(7);
    return { password: hashPassword(password, salt), salt: salt};
}
// salt + 100 rounds
function hashPassword(password, salt) {
  var salted = salt + password;
  var hash = bcrypt.hashSync(salted);
  for (var i = 0; i < 99; i++) { // 100 rounds
    hash = bcrypt.hashSync(hash);
  }
  return hash;
}

function checkPassword(isPassword, salt, expectedPassword) {
  return hashPassword(isPassword) === expectedPassword;
}
