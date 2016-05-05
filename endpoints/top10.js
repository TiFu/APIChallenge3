var main = null;

exports.init = function(mainApp) {
  main = mainApp;

  mainApp.addEndpoint("/api/top10/champions", getTop10Champions)
  mainApp.addEndpoint("/api/top10/players", getTop10Players)
  mainApp.addEndpoint("/api/top10/players/:championId", getTop10PlayersPerChamp);
}


function getTop10Players(req,res, next) {

  sendTop10(transformWithLast2Weeks("SELECT s.summoner_name as name, s.summoner_id as id, SUM(pts_gained) / COUNT(pts_gained) as avg FROM gains g, summoners s where s.summoner_id = g.summoner_id and g.game_timestamp > now() - interval ?+1 week and g.game_timestamp < now() - interval ? week group by g.summoner_id order by avg desc"), res)
}

function getTop10Champions(req, res, next) {
sendTop10(transformWithLast2Weeks("SELECT c.name as name, c.id as id, SUM(pts_gained) / COUNT(pts_gained) as avg FROM gains g, champions c where c.id = g.champion_id and g.game_timestamp > now() - interval ?+1 week and g.game_timestamp < now() - interval ? week group by g.champion_id order by avg desc;"), res);
}

function getTop10PlayersPerChamp(req, res, next) {
  sendTop10(transformWithLast2Weeks("SELECT s.summoner_name as name, s.summoner_id as id, SUM(pts_gained) / COUNT(pts_gained) as avg FROM gains g, summoners s where s.summoner_id = g.summoner_id and g.game_timestamp > now() - interval ?+1 week and g.game_timestamp < now() - interval ? week and g.champion_id = ? group by g.summoner_id order by avg desc", req.params.championId), res);
}

// first param is week, second summoner_id
function transformWithLast2Weeks(queryString, champion_id) {
  var thisWeek;
  var parameters = champion_id ? [0,0, champion_id] : [0,0];
 return  main.database.query(queryString, parameters).then((result) => {
    thisWeek = transformToTop10Entry(result);
    parameters[0]++;
    parameters[1]++;
    return main.database.query(queryString, parameters);
  }).then((result) => {
    return {thisWeek: thisWeek, lastWeek: transformToTop10Entry(result)};
  })
}
function transformToTop10Entry(result) {
    var outputVal = [];
    var min = Number.POSITIVE_INFINITY;
    var max = Number.NEGATIVE_INFINITY;
    for (var i = 0; i < result.length; i++) {
      var current = result[i];
      if (!current.avg) {
        current.avg = 0;
      }
      outputVal.push({rank: i+1, id: current.id, name: current.name, change: current.avg})
      if (current.avg < min) {
        min = current.avg;
      }
      if (current.avg > max) {
        max = current.avg;
      }
    }

   return {max: max, min: min, data: outputVal};
}
function sendTop10(query, res) {
  query.then((result) => {
    res.status(200).send(result);
  }).catch((err) => {
    main.logger.warn(err);
    res.status(500).send("Internav Server Error");
  });

}
