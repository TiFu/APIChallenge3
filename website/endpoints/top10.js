var main = null;
exports.name = "top10";

exports.init = function(mainApp) {
  main = mainApp;

  mainApp.addEndpoint("/api/top10/champions/:all?", getTop10Champions)
  mainApp.addEndpoint("/api/top10/players/champion/:championId/:all?", getTop10PlayersPerChamp);
  mainApp.addEndpoint("/api/top10/players/:all?", getTop10Players)
}


function getTop10Players(req,res, next, connection) {
  sendTop10(transformWithLast2Weeks("SELECT s.summoner_name as name, s.summoner_id as id, s.summoner_icon as icon, SUM(pts_gained) / COUNT(pts_gained) as avg FROM summoners s LEFT JOIN gains g on s.summoner_id = g.summoner_id where g.game_timestamp > now() - interval (3*?+3) day and g.game_timestamp < now() - interval (3*?) day or pts_gained is null group by g.summoner_id order by avg desc", undefined, connection), res, req, connection)
}

function getTop10Champions(req, res, next, connection) {
sendTop10(transformWithLast2Weeks("SELECT c.name as name, c.id as id, c.full as icon, SUM(pts_gained) / COUNT(pts_gained) as avg FROM gains g, champions c where c.id = g.champion_id and g.game_timestamp > now() - interval 3*?+3 day and g.game_timestamp < now() - interval 3*? day group by g.champion_id order by avg desc;", undefined,  connection), res, req, connection);
}

function getTop10PlayersPerChamp(req, res, next, connection) {
  sendTop10(transformWithLast2Weeks("SELECT s.summoner_name as name, s.summoner_id as id, s.summoner_icon as icon, SUM(pts_gained) / COUNT(pts_gained) as avg FROM gains g, summoners s where s.summoner_id = g.summoner_id and g.game_timestamp > now() - interval 3*?+3 day and g.game_timestamp < now() - interval 3*? day and g.champion_id = ? group by g.summoner_id having avg is not null order by avg desc", req.params.championId, connection), res, req, connection);
}

// first param is week, second summoner_id
function transformWithLast2Weeks(queryString, champion_id, connection) {
  var thisWeek;
  var parameters = champion_id ? [0,0, champion_id] : [0,0];
 return  connection.query(queryString, parameters).then((result) => {
    thisWeek = transformToTop10Entry(result);
    parameters[0]++;
    parameters[1]++;
    return connection.query(queryString, parameters);
  }).then((result) => {
    var lastWeek = transformToTop10Entry(result);
    return transformChange(thisWeek, lastWeek);
  })
}

function transformChange(thisWeek, lastWeek) {
  thisWeek.minChange = thisWeek.min - lastWeek.min;
  thisWeek.maxChange = thisWeek.max - lastWeek.max;
  thisWeek.avgChange = thisWeek.avg - lastWeek.avg;
  var lastWeekMap = {};
  for (var i = 0; i < lastWeek.data.length; i++) {
    var current = lastWeek.data[i];
    lastWeekMap[current.id] = current;
  }

  for (var i = 0; i < thisWeek.data.length; i++) {
    if (!lastWeekMap[thisWeek.data[i].id]) {
      thisWeek.data[i].rankChange = "NEW";
      thisWeek.data[i].pointsChange = "NEW";
    } else {
      thisWeek.data[i].rankChange = - thisWeek.data[i].rank + lastWeekMap[thisWeek.data[i].id].rank; // rank is the other way around
      thisWeek.data[i].pointsChange = thisWeek.data[i].points - lastWeekMap[thisWeek.data[i].id].points;
    }
  }
  return thisWeek;
}
function transformToTop10Entry(result) {
    var outputVal = [];
    var min = Number.POSITIVE_INFINITY;
    var max = Number.NEGATIVE_INFINITY;
    var avg = 0;
    var avgCounter = 0;
    for (var i = 0; i < result.length; i++) {
      var current = result[i];
      if (!current.avg) {
        current.avg = 0;
      }
      outputVal.push({rank: i+1, id: current.id, name: current.name, icon: current.icon, points: current.avg})
      avg += current.avg;
      if (current.avg > 0) {
        avgCounter++;
      }
      if (current.avg < min) {
        min = current.avg;
      }
      if (current.avg > max) {
        max = current.avg;
      }
    }

   return {max: max, min: min, avg: avg / avgCounter, data: outputVal};
}
function sendTop10(query, res, req, connection) {
  query.then((result) => {
    if (!req.params.all) {
      result.data = result.data.slice(0,10);
    }
    res.status(200).send(result);
  }).catch((err) => {
    main.logger.warn(err);
    res.status(500).send("Internal Server Error");
  }).then(() => {
    main.releaseConnection(connection);
  });

}
