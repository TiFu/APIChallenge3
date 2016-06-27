
var main = null;
exports.init = function(mainApp) {
  main = mainApp;

  main.addEndpoint("/api/dashboard", dashboard);
}

function dashboard(req, res, next) {
  res.status(200).send({
    "top5championsglobal": [
      {"rank": 1, "localrank": 5, "name": "Annie", "points": 1700, "pointschange" : 500, "rankchange": 2},
      {"rank": 2, "localrank": 1, "name": "Urgot", "points": 1500, "pointschange": -200, "rankchange": 1},
      {"rank": 3, "localrank": 10, "name": "Urgot", "points": 1200, "pointschange": -200, "rankchange": -2},
      {"rank": 4, "localrank": 3, "name": "Katarina", "points": 100, "pointschange": -200, "rankchange": -1},
      {"rank": 5, "localrank": 4, "name": "Singed", "points": 50, "pointschange": -200, "rankchange": 3}
    ],
    "top5playersglobal": [
      {"rank": 1, "localrank": 5, "name": "Bjergsen", "points": 1700, "pointschange" : 500, "rankchange": 2},
      {"rank": 2, "localrank": 1, "name": "Faker", "points": 1500, "pointschange": -200, "rankchange": 1},
      {"rank": 3, "localrank": 10, "name": "Riot Tuxedo", "points": 1200, "pointschange": -200, "rankchange": -2},
      {"rank": 4, "localrank": 3, "name": "Riot Schmick", "points": 100, "pointschange": -200, "rankchange": -1},
      {"rank": 5, "localrank": 4, "name": "AdoboPR", "points": 50, "pointschange": -200, "rankchange": 3}
    ],
    "rankdistribution": {
      "1": 10,
      "2": 10,
      "3": 30,
      "4": 40,
      "5": 50,
      "6": 0,
      "7": 10
    },
    "lastgame": {
      "championId": 1,
      "kills": 5,
      "deaths": 10,
      "assists":1,
      "pts_gained": 1000,
      "timestamp": Date.now()
    },
    "followedplayers": [
      {"name": "Bjergsen", "region": "NA", "pts_gained": 1500, "games": 5, "localrank": 10, "globalrank": 11},
      {"name": "Riot Tryndamere", "region": "NA", "pts_gained": 1, "games": 200, "localrank": 1000, "globalrank": 1000}
    ]
  })
}
