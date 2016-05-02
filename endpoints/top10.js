var main = null;

exports.init = function(mainApp) {
  main = mainApp;

  mainApp.addEndpoint("/api/top10/champions", getTop10Champions)
  mainApp.addEndpoint("/api/top10/players", getTop10Players)
  mainApp.addEndpoint("/api/top10/players/:championId", getTop10PlayersPerChamp);
}


function getTop10Players(req,res, next) {
  sendTop10(main.database.query("SELECT s.summoner_name as id, SUM(pts_gained) / COUNT(pts_gained) as avg FROM gains g, summoners s where s.summoner_id = g.summoner_id and g.game_timestamp > now() - interval 1 week group by g.summoner_id order by avg desc LIMIT 10"), res);
}

function getTop10Champions(req, res, next) {
  sendTop10(main.database.query("SELECT c.name as id, SUM(pts_gained) / COUNT(pts_gained) as avg FROM gains g, champions c where c.id = g.champion_id and g.game_timestamp > now() - interval 1 week group by g.champion_id order by avg desc LIMIT 10;"), res);
}

function getTop10PlayersPerChamp(req, res, next) {
  sendTop10(  main.database.query("SELECT s.summoner_name as id, SUM(pts_gained) / COUNT(pts_gained) as avg FROM gains g, summoners s where s.summoner_id = g.summoner_id and g.game_timestamp > now() - interval 1 week and g.champion_id = ? group by g.summoner_id order by avg desc LIMIT 10", [req.params.championId]), res);
}

function sendTop10(query, res) {
  query.then((result) => {
    var outputVal = [];
    for (var i = 0; i < result.length; i++) {
      var current = result[i];
      outputVal.push({rank: i+1, id: current.id, change: current.avg})
    }
    res.status(200).send(outputVal);
  }).catch((err) => {
    main.logger.warn("Couldn't collect data for query " + query, err);
    res.status(500).send("Internav Server Error");
  });

}
