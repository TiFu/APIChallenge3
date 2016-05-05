
var main = null;

exports.init = function(mainApp) {
  main = mainApp;

  main.addEndpoint("/api/champion/:championId", getChampionStats);
}


function getChampionStats(req, res, next) {
  var champion_id = req.params.championId;
  var promises = [];
  promises.push(getChampionData(champion_id));
  promises.push(getCountableStats(champion_id));
  promises.push(getMasteryDistribution(champion_id));
  promises.push(getMaxGradeDistribution(champion_id));
  promises.push(getPercentSumsChestGranted(champion_id));
  promises.push(getTop10PlayersPerChamp(champion_id));
  promises.push(getChampionRank(champion_id));
  promises.push(getTotalPointsDistribution(champion_id));

  var resultObj = {};
  Promise.all(promises).then((result) => {
    for (var i = 0; i < result.length; i++) {
      resultObj[result[i].name] = result[i].data;
    }
    res.status(200).send(resultObj);
  }).catch((err) => {
    main.logger.warn(err);
    res.status(500).send("Internal Server Error");
  });
}

function getTotalPointsDistribution(champion_id) {
    return main.database.query("select max(pts_total) as max_pts, min(pts_total) as min_pts, STDDEV(pts_total) as standard_deviation,  sum(pts_total) / count(pts_total) as avg_pts from current_mastery where champion_id = ?", [champion_id]).then((result) => {
      return {name: "totalptsstats", data: result[0]};
    });
}


function getChampionData(champion_id) {
  return main.database.query("SELECT id, name, full, sprite from champions where id = ?", [champion_id]).then((result) => {
    return {name: "data", data: result[0]};
  })
}
// avg_gains, games_played, avg_games_summoner, number_of_summoners_played last week
function getCountableStats(champion_id) {
  return main.database.query("select sum(pts_gained) / count(pts_gained) as avg_gains, count(*) as games_played, count(*)  / count(distinct summoner_id) as avg_games_summoner, count(distinct summoner_id) as summoners_played FROM gains g where champion_id = ? and game_timestamp > now() - Interval 1 week group by champion_id;", [champion_id]).then((result) => {
    return {name: "stats", data: result[0]};
  });
}

function getMasteryDistribution(champion_id) {
  var masteryDistribution = [0,0,0,0,0,0];
  return main.database.query(" select mastery_level, count(*) as cnt from current_mastery where champion_id = ? group by mastery_level;", [champion_id]).then((result) => {
    result.forEach(r => masteryDistribution[r.mastery_level] = r.cnt);
    return main.database.query("select count(*) as cnt from summoners;");
  }).then((totalSummonersResult) => {
    masteryDistribution[0] = totalSummonersResult[0].cnt - masteryDistribution.reduce((previousValue, currentValue) => previousValue + currentValue, 0);

    return {name: "masterydistribution", data: masteryDistribution};
  });
}

function getMaxGradeDistribution(champion_id) {
  return main.database.query("select highest_grade, count(highest_grade) as cnt from current_mastery where champion_id = ? group by highest_grade" , [champion_id]).then((result) => {
    return {name: "gradedistribution", data: result[0]};
  })
}

// percent of sums who played the champ
function getPercentSumsChestGranted(champion_id) {
  return main.database.query("select sum(chest_granted = 1) as yes, sum(chest_granted = 0) as no from current_mastery;").then((result) => {
    return {name: "percent_chest_granted", data: result[0]};
  })
}

function getTop10PlayersPerChamp(champion_id) {
  return main.database.query("SELECT s.summoner_name as name, s.summoner_id as id, SUM(pts_gained) / COUNT(pts_gained) as avg FROM gains g, summoners s where s.summoner_id = g.summoner_id and g.game_timestamp > now() - interval 1 week and g.champion_id = ? group by g.summoner_id order by avg desc LIMIT 10", [champion_id]).then((result) => {
    var outputVal = [];
    for (var i = 0; i < result.length; i++) {
      var current = result[i];
      outputVal.push({rank: i+1, id: current.id, name: current.name, change: current.avg})
    }
    return {name: "top10Players", data: outputVal};
  })
}

function getChampionRank(champion_id) {
  return main.database.query("select rank, avg_gain, games from (select @rn:=@rn+1 as rank, champion_id, avg_gain, games FROM (select @rank:=@rank+1 as rank, champion_id, sum(pts_gained)/count(pts_gained) as avg_gain, count(pts_gained) as games from gains where game_timestamp > now() - interval 1 week group by champion_id having avg_gain is not null order by avg_gain desc) t1, (select @rn:=0) t2) t3 where t3.champion_id = ?", [champion_id]).then((result) => {
    return {name: "rank", data: result[0]};
  })
}