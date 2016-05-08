
var main = null;
exports.name = "champion";

exports.init = function(mainApp) {
  main = mainApp;

  main.addEndpoint("/api/champion/:championId", getChampionStats);
}


function getChampionStats(req, res, next, connection) {
  var champion_id = req.params.championId;
  var promises = [];
  promises.push(getChampionData(champion_id, connection));
  promises.push(getCountableStats(champion_id, connection));
  promises.push(getMasteryDistribution(champion_id, connection));
  promises.push(getMaxGradeDistribution(champion_id, connection));
  promises.push(getPercentSumsChestGranted(champion_id, connection));
  promises.push(getTop10PlayersPerChamp(champion_id, connection));
  promises.push(getChampionRank(champion_id, connection));
  promises.push(getTotalPointsDistribution(champion_id, connection));
  promises.push(getTop10HighestMastery(champion_id, connection));
  var resultObj = {};
  Promise.all(promises).then((result) => {
    for (var i = 0; i < result.length; i++) {
      resultObj[result[i].name] = result[i].data;
    }
    res.status(200).send(resultObj);
    return true;
  }).catch((err) => {
    main.logger.warn(err);
    res.status(500).send("Internal Server Error");
    return true;
  }).then(() => {
    main.releaseConnection(connection);
  });
}

function getTotalPointsDistribution(champion_id, connection) {
    return connection.query("select max(pts_total) as max_pts, min(pts_total) as min_pts, STDDEV(pts_total) as standard_deviation,  sum(pts_total) / count(pts_total) as avg_pts from current_mastery where champion_id = ?", [champion_id]).then((result) => {
      return {name: "totalptsstats", data: result[0]};
    });
}


function getChampionData(champion_id, connection) {
  return connection.query("SELECT id, name, full, sprite from champions where id = ?", [champion_id]).then((result) => {
    return {name: "data", data: result[0]};
  })
}
// avg_gains, games_played, avg_games_summoner, number_of_summoners_played last week
function getCountableStats(champion_id, connection) {
  return connection.query("select sum(pts_gained) / count(pts_gained) as avg_gains, count(*) as games_played, count(*)  / count(distinct summoner_id) as avg_games_summoner, count(distinct summoner_id) as summoners_played FROM gains g where champion_id = ? and game_timestamp > now() - Interval 3 day group by champion_id;", [champion_id]).then((result) => {
    return {name: "stats", data: result[0]};
  });
}

function getMasteryDistribution(champion_id, connection) {
  var masteryDistribution = [0,0,0,0,0,0];
  return connection.query(" select mastery_level, count(*) as cnt from current_mastery where champion_id = ? group by mastery_level;", [champion_id]).then((result) => {
    result.forEach(r => masteryDistribution[r.mastery_level] = r.cnt);
    return connection.query("select count(*) as cnt from summoners;");
  }).then((totalSummonersResult) => {
    var elemSum = masteryDistribution.reduce((previousValue, currentValue) => previousValue + currentValue, 0);
    masteryDistribution[0] = totalSummonersResult[0].cnt - elemSum;
    var avg = masteryDistribution.reduce((previous, current, index) => {
      return previous += current * index;
    },0) / elemSum;
    return {name: "masterydistribution", data: {avg: avg, distribution: masteryDistribution} };
  });
}

function getMaxGradeDistribution(champion_id, connection) {
  return connection.query("select highest_grade, count(*) as cnt from current_mastery where champion_id = ? group by highest_grade" , [champion_id]).then((result) => {
    return {name: "gradedistribution", data: result};
  })
}

// percent of sums who played the champ
function getPercentSumsChestGranted(champion_id, connection) {
  var res;
  return connection.query("select sum(chest_granted = 1) as yes from current_mastery where champion_id = ?;", [champion_id]).then((result) => {
    res = result[0];
    return connection.query("select count(*) as cnt from summoners;");
  }).then((sums) => {
    res.no = sums[0].cnt - res.yes;
    return {name: "percent_chest_granted", data: res};
  })
}

function getTop10HighestMastery(champion_id, connection) {
    return connection.query("SELECT pts_total, mastery_level, pts_next, pts_since FROM current_mastery WHERE champion_id = ? group by summoner_id ORDER BY pts_total DESC LIMIT 10", [champion_id]).then((result) => {
      return {name: "top10HighestMastery", data: result};
    })
}

function getTop10PlayersPerChamp(champion_id, connection) {
  return transformWithLast2Weeks("SELECT s.summoner_name as name, s.summoner_id as id, count(pts_gained) as games,  MAX(pts_total) as total, MAX(pts_gained) as max, MIN(pts_gained) as min, SUM(pts_gained) / COUNT(pts_gained) as avg FROM gains g, summoners s where g.pts_gained is not null and s.summoner_id = g.summoner_id and g.game_timestamp > now() - interval 3*?+3 day and g.game_timestamp < now() - interval 3 * ? day and g.champion_id = ? group by g.summoner_id order by avg desc LIMIT 10", [champion_id], connection).then((result) => {
    return {name: "top10Players", data: result};
  })
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

function getChampionRank(champion_id, connection) {
  return connection.query("select rank, avg_gain, games from (select @rn:=@rn+1 as rank, champion_id, avg_gain, games FROM (select @rank:=@rank+1 as rank, champion_id, sum(pts_gained)/count(pts_gained) as avg_gain, count(pts_gained) as games from gains where game_timestamp > now() - interval 3 day group by champion_id having avg_gain is not null order by avg_gain desc) t1, (select @rn:=0) t2) t3 where t3.champion_id = ?", [champion_id]).then((result) => {
    return {name: "rank", data: result[0]};
  })
}
