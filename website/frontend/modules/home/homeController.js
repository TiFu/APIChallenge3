'use strict';

angular.module('Home', ['ngMaterial', 'ngRoute', 'chart.js'])
.constant('graphMaster', {})

.controller('HomeController', [
	'$scope',
	'$location',
	'$timeout',
	'$routeParams',
	'$http',
	'$route',
	'$mdToast',
	'MainService',
	'top',
	'champions',
	'graphMaster',
function(
	$scope,
	$location,
	$timeout,
	$routeParams,
	$http,
	$route,
	$mdToast,
	MainService,
	top,
	champions,
	graphMaster) {

	var IMGURL = 'http://ddragon.leagueoflegends.com/cdn/6.9.1/img/champion/';
	var PROFILEICONURL = 'http://ddragon.leagueoflegends.com/cdn/6.9.1/img/profileicon/';
	$scope.scrollToTop = scrollToTop;
	$scope.searchForPlayerChampion = searchForPlayerChampion;


	//will run when event queue for this controller has settled down
	activate();

	function activate() {
	//If we have no top10 data, show error mask
	if (!top.data.data.length) {
		executeOrder66();
		return;
	}

	var mode = getCurrentRequest();
	var results = top.data;
	//print all but first param which is home, will return us our pathing request.
	//i.e. if mode = ['home','graves','brand'], will print graves, brand. For path of Home/Graves/Brand
	console.log('mode', mode, mode.length);


	loadingDataStart();
	if (mode.length === 1) {
		$scope.viewMode = 'Main';
		runMainView(mode, results);
	} else if (mode.length === 2) {
	       if(_.find(champions.data, { 'name': mode[1]})) {
				$scope.viewMode = 'Champion';
				var id = _.find(champions.data, { 'name': mode[1]}).id;
				searchForChampion(id);
			} else {
				$scope.viewMode = 'Summoner';
				searchForPlayer(mode[1]);
			}
			} else if (mode.length === 3 || (mode.length === 4 && mode[3] === '')) {
				$scope.viewMode = 'Summoner & Champion';
				var champ = _.filter(champions.data, { 'name': mode[1]}) ? _.filter(champions.data, { 'name': mode[1]})
				                                                         : _.filter(champions.data, { 'name': mode[2]});
				if (_.isUndefined(champ)) {
					//no champion specified
					$location.path('/home');
					return;
				} else {
					if (_.get(champ, '[0].id')) {
					    console.log('champ',mode[1]);
						console.log('player',mode[2]);
						searchForChampionAndPlayer(mode[1].id,mode[2]);
					} else {
						console.log('champ',mode[2]);
						console.log('player',mode[1]);
						searchForChampionAndPlayer(mode[2].id,mode[1]);
					}
				}
				
			}	else {
				$location.path('/home');
			}
}

function runSummonerView(data) {
	if (!data.success) {
		loadingDataEnd();
		executeOrder66();
		return;
	}
	loadingDataStart();
	$scope.summonerData = data;
	$scope.champList = data.top10champions;
	//updateChampionSpinners(21333);

	if (!$scope.summonerData.globalrank[0]) { // add defaults if nothing recorded yet
		var obj = {};
		obj.rank = "no data yet";
		obj.avg_gain = "no data yet";
		obj.games = "no data yet";
		obj.week = "no data yet";
		$scope.summonerData.globalrank.push(obj);
	}
	//graph level data
	$scope.summonerData.levelGraph = _.map($scope.summonerData.masterydistribution.distribution, function(value, key) {
		return {labels: 'Level ' + (key+1), data: value}
	});

	$scope.summonerData.levelGraph.labels = [];
	$scope.summonerData.levelGraph.data = [];

	_.each($scope.summonerData.levelGraph, function(mastery) {
		$scope.summonerData.levelGraph.labels.push(mastery.labels);
		$scope.summonerData.levelGraph.data.push(mastery.data);
	});


	//graph grades
	//$scope.summonerData.gradeGraph = _.filter($scope.summonerData.highestgradedistribution, 'grade');
	$scope.summonerData.gradeGraph = $scope.summonerData.highestgradedistribution;	
	$scope.summonerData.gradeGraph = _.filter($scope.summonerData.gradeGraph, 'highest_grade');
	$scope.summonerData.gradeGraph = _.map($scope.summonerData.gradeGraph, function(value, key) {
		return {labels: value['highest_grade'] == null ? "No Grade yet" : 'Grade ' + value['highest_grade'], data: value['cnt']}
	});

	$scope.summonerData.gradeGraph.labels = [];
	$scope.summonerData.gradeGraph.data = [];

	_.each($scope.summonerData.gradeGraph, function(mastery) {
		$scope.summonerData.gradeGraph.labels.push(mastery.labels);
		$scope.summonerData.gradeGraph.data.push(mastery.data);
	});

	//setup data for showing all champion masteries
	_.each($scope.summonerData.champions, function(mastery) {
		mastery.currentPointCircle = mastery.mastery_level === 5 ? 100 : getToGoPoints(mastery);
	});
	$scope.summonerData.champions = _.orderBy($scope.summonerData.champions, ['mastery_level', 'currentPointCircle'], ['desc', 'desc']);
	$scope.summonerData.top10Champions = $scope.summonerData.champions.slice(0,6);
	$scope.summonerData.allNon0 = _.filter($scope.summonerData.champions, 'pts_total');

	//push graph data onto graphMaster
    graphMaster.levelGraphLabel = $scope.summonerData.levelGraph.labels;
    graphMaster.levelGraphData = $scope.summonerData.levelGraph.data;
    graphMaster.gradeGraphLabel = $scope.summonerData.gradeGraph.labels;
	graphMaster.gradeGraphData = $scope.summonerData.gradeGraph.data;
	//show graphs
	$scope.lotsGraphReady = true;

	$scope.topChampions = $scope.summonerData.champions.slice(0,3);
	loadingDataEnd();
}

function getToGoPoints(champ) {
	var level2 = 1800;
	var level3 = 4200;
	var level4 = 6600;
	var level5 = 9000;

	switch(champ.mastery_level)  {
    case 1:
        return Math.ceil((champ.pts_next / level2) * 100);
    case 2:
        return Math.ceil((champ.pts_next / level3) * 100);
    case 3:
        return Math.ceil((champ.pts_next / level4) * 100);
    case 4:
        return Math.ceil((champ.pts_next / level5) * 100);
    default:
        return 0;
	}
}

$scope.loadMoreChampionMasteries = function() {
	$scope.summonerData.top10Champions = $scope.summonerData.allNon0;
	$scope.$applyAsync();

	$timeout(function() {$("html, body").animate({ scrollTop: $(document).height() }, "slow")},0);
}

function runChampionView(data) {
	if (_.isEmpty(data)) {
		loadingDataEnd();
		executeOrder66();
		return;
	}
	loadingDataStart();

	$scope.championData = data;
	$scope.championData.top10Players.data = $scope.championData.top10Players.data.map(mapChampData);
	//graph level data
	$scope.championData.levelGraph = _.map($scope.championData.masterydistribution.distribution, function(value, key) {
		return {labels: 'Level ' + (key+1), data: value}
	});

	if ($scope.championData.levelGraph[0].labels.slice(-1) === '0') {
		$scope.championData.levelGraph.shift();
	}

	$scope.championData.levelGraph.labels = [];
	$scope.championData.levelGraph.data = [];

	_.each($scope.championData.levelGraph, function(mastery) {
		$scope.championData.levelGraph.labels.push(mastery.labels);
		$scope.championData.levelGraph.data.push(mastery.data);
	});


	//graph grades
	//$scope.championData.gradeGraph = _.filter($scope.championData.gradedistribution, 'highest_grade');
	$scope.championData.gradeGraph = $scope.championData.gradedistribution;
	$scope.championData.gradeGraph = _.filter($scope.championData.gradeGraph, 'highest_grade');
	$scope.championData.gradeGraph = _.map($scope.championData.gradeGraph, function(value, key) {
		return {labels: value['highest_grade'] == null ? "No Grade yet" : 'Grade ' + value['highest_grade'], data: value['cnt']}
	});

	$scope.championData.gradeGraph.labels = [];
	$scope.championData.gradeGraph.data = [];

	_.each($scope.championData.gradeGraph, function(mastery) {
		$scope.championData.gradeGraph.labels.push(mastery.labels);
		$scope.championData.gradeGraph.data.push(mastery.data);
	});

	//push graph data onto graphMaster
    graphMaster.levelGraphLabelC = $scope.championData.levelGraph.labels;
    graphMaster.levelGraphDataC = $scope.championData.levelGraph.data;
    graphMaster.gradeGraphLabelC = $scope.championData.gradeGraph.labels;
	graphMaster.gradeGraphDataC = $scope.championData.gradeGraph.data;

	//show graphs
	$scope.lotsGraphReady = true;
	loadingDataEnd();
}

function runMainView(mode, results) {
	loadingDataStart();
	$scope.champList = results.data;
	$scope.championCount = champions.length;
	var max = results.max;

	updateChampionInfo(max);

	//grab top 3 champions
	$scope.topChampions = $scope.champList.slice(0,3);
	loadingDataEnd();
	//run circles
	runLevels();

}

function runChampionAndSummonerView(data) {
	if (_.isEmpty(data)) {
		loadingDataEnd();
		executeOrder66();
		return;
	}
	loadingDataStart();
	console.log('data', data);
}

function mapChampData(champ) {
		//roud points
		champ.points = Math.ceil(champ.points);
		champ.pointsChange = Math.ceil(champ.pointsChange);

		//add points direction and remove +/-
		champ.pointsChangeDirection = champ.pointsChange < 0 ? 'down' : 'up'
		champ.pointsChange = champ.pointsChange.toString().replace(/-/g, '');

		//handle NaN
		champ.pointsChange = champ.pointsChange === 'NaN' ? champ.points : champ.pointsChange;

		//add rank direction and remove +/-
		champ.rankChangeDirection = champ.rankChange < 0 ? 'down' : 'up';
		champ.rankChangeDirection = champ.rankChange === "NEW" ? "upNew" : champ.rankChangeDirection;

		champ.rankChange = champ.rankChange.toString().replace(/-/g, '');
		//handle NaN
		champ.rankChange = champ.rankChange.toString() === 'NaN' ? 0 : champ.rankChange;

	return champ;
}

function updateChampionInfo(max) {
	$scope.champList = $scope.champList.map(function(champ) {
		champ = mapChampData(champ);
		//get a 1 thru 100% of where this champ is compared to highest champ score.
		champ.masteryAverage = (champ.points / max)*100;
		champ.currentAverage = 0;
		return champ;
	});
}

function updateChampionSpinners(max) {
	$scope.champList = $scope.champList.map(function(champ) {
		//get a 1 thru 100% of where this champ is compared to highest champ score.
		if (champ.mastery_level === 5) {
			champ.masteryAverage = 100;
		} else {

		}
		champ.masteryAverage = (champ.pts_total / max)*100;
		champ.currentAverage = 0;
		return champ;
	});
}

function getCurrentRequest() {
	var mode = $location.path().split('/');
	mode.shift();
	return mode;
}

	//run the circle animations
	function runLevels() {
		champ1Circle();
		champ2Circle();
		champ3Circle();
	}

	//champion 1's circle animation
	function champ1Circle() {
		if (($scope.topChampions[0].currentAverage > $scope.topChampions[0].masteryAverage) ||
			$scope.topChampions[0].currentAverage > 100) {
			return;
		}
			$scope.topChampions[0].currentAverage++;
			$timeout(champ1Circle, 15);

	}

	//champion 2's circle animation
	function champ2Circle() {
		if (($scope.topChampions[1].currentAverage > $scope.topChampions[1].masteryAverage) ||
			$scope.topChampions[1].currentAverage > 100) {
			return;
		}
			$scope.topChampions[1].currentAverage++;
			$timeout(champ2Circle, 15);
	}

	//champion 3's circle animation
	function champ3Circle() {
		if (($scope.topChampions[2].currentAverage > $scope.topChampions[2].masteryAverage) ||
			$scope.topChampions[2].currentAverage > 100) {
			return;
		}
			$scope.topChampions[2].currentAverage++;
			$timeout(champ3Circle, 15);
	}

	$scope.getImgUrl = function(name) {
		if (_.isEmpty(champions.data) || _.isUndefined(name)) {
			return;
		}
		return IMGURL + _.find(champions.data, {name: name}).full;
	}

	$scope.getProfileIconUrl = function(id) {
		return PROFILEICONURL + id + ".png";
	}

	$scope.getMasteryIcon = function(level) {
		switch(level)  {
    		case 1:
    		    return 'http://i.imgur.com/vPzKnGf.png';
    		case 2:
    		    return 'http://i.imgur.com/fEpnvCZ.png';
    		case 3:
    		    return 'http://i.imgur.com/Cd90pem.png';
    		case 4:
    		    return 'http://i.imgur.com/p2Dekzi.png';
    		case 5:
    		    return 'http://i.imgur.com/bLhZdEB.png';
    		default:
    		    return 'http://i.imgur.com/vPzKnGf.png';
		}
	}

	//selecting a champion/summoner should generically path to a new url.
	//will trigger a new query when the controller re-loads.
	$scope.goto = function(champ) {
		$location.path('/home/'+champ);
	}

	$scope.retryNoData = function() {
		$scope.retryNoDataError = true;
		$timeout(function() { $route.reload(); }, 1000);
	}

	//pushes placeholder data (will be endpoint) onto table, then runs scrollToBottom
	$scope.loadMore = function() {
		console.log('loading more');
		$scope.loadingTable = true;
		showSimpleToast('mtest');
		MainService.GetAllChampions()
		.success(function(result) {
			top.data = result;
			activate();
			$timeout(scrollToBottom,1000);
		})
		.error(function(err) {
			console.log(err);
		});
	}

	//smooth scroll to bottom of the main table
	function scrollToBottom() {
			var targetDiv = $('.table-listings');
			var height = targetDiv[0].scrollHeight;
  			targetDiv.animate({scrollTop:height});
  			$scope.loadingTable = false;
	}

	//smooth scroll to top of the main table
	function scrollToTop() {
			var targetDiv = $('.table-listings');
			var height = 0;
  			targetDiv.animate({scrollTop:height});
	}

	function searchForPlayerChampion() {
		loadingDataStart();
		$scope.searchingGlobally = true;
		$location.path('/home/'+$scope.globalSearch);
		$scope.globalSearch = '';
	}

	function searchForChampionAndPlayer(champID,SummonerName) {
		loadingDataStart();
        //Find Summoner
		MainService.getPlayerInfo(SummonerName)
				.then(function(result) {
					//Find Summoner And Champion
       				MainService.getChampionAndPlayerInfo(champID,SummonerName)
						.success(function(result) {
							runChampionAndSummonerView(champID, result.data.id);
						})
						.catch(function(result) {
							soundTheAlarm('Could not find summoner!');
						});
				})
				.catch(function(err) {
					soundTheAlarm('Could not find summoner!');
				});
  }

	function searchForPlayer(summonerName) {
		loadingDataStart();
		MainService.getPlayerInfo(summonerName)
		.success(function(result) {
			runSummonerView(result);
		})
		.catch(function(result) {
			soundTheAlarm('Could not find summoner!');
		});
	}


	function searchForChampion(id) {
		loadingDataStart();
		MainService.getChampionInfo(id)
		.success(function(result) {
			runChampionView(result);
		})
		.catch(function(result) {
			soundTheAlarm('Could not find champion!');
		});
	}

	//STAR WARS REFERENCE, MANDATORY TO KNOW!
	function executeOrder66() {
		$scope.noDataError = true;
		//log errors
	}

	//expiramental toast - not in use
	function showSimpleToast(message) {
    $mdToast.show(
      $mdToast.simple()
        .textContent(message)
        .position({bottom: false,top: true,left: false,right: true})
        .hideDelay(3000)
    );
  };

  function loadingDataStart() {
  	$scope.loadingData = true;
  }

  function loadingDataEnd() {
  	$scope.loadingData = false;
  }

  function soundTheAlarm(message) {
  	$scope.errorMessage = message;
  	console.log('alarm', message);
  	$timeout(function() {
  		$scope.errorMessage = '';
  	}, 3000);
  }


}])
.controller('levelGraphController', ['$scope', '$timeout', 'graphMaster', function($scope, $timeout, graphMaster) {
	activate();
	function activate() {
		$scope.graphColors = [
		  '#5DA5DA',
		  '#FAA43A',
		  '#60BD68',
		  '#F17CB0',
		  '#B2912F',
		  '#B276B2',
		  '#DECF3F',
		  '#F15854',
		  '#4D4D4D'
    	];
		$scope.labels= graphMaster.levelGraphLabel;
		$scope.data= graphMaster.levelGraphData;
    }
}])
.controller('gradeGraphController', ['$scope', '$timeout', 'graphMaster', function($scope, $timeout, graphMaster) {
	activate();
	function activate() {
		$scope.graphColors = [
		  '#5DA5DA',
		  '#FAA43A',
		  '#60BD68',
		  '#F17CB0',
		  '#B2912F',
		  '#B276B2',
		  '#DECF3F',
		  '#F15854',
		  '#4D4D4D'
    	];
		$scope.labels= graphMaster.gradeGraphLabel;
		$scope.data= graphMaster.gradeGraphData;

    }
}])
.controller('levelGraphControllerC', ['$scope', '$timeout', 'graphMaster', function($scope, $timeout, graphMaster) {
	activate();
	function activate() {
		$scope.graphColors = [
		  '#5DA5DA',
		  '#FAA43A',
		  '#60BD68',
		  '#F17CB0',
		  '#B2912F',
		  '#B276B2',
		  '#DECF3F',
		  '#F15854',
		  '#4D4D4D'
    	];
		$scope.labels= graphMaster.levelGraphLabelC;
		$scope.data= graphMaster.levelGraphDataC;
		$scope.options = {
    tooltipEvents: [],
    showTooltips: true,
    tooltipCaretSize: 0,
    onAnimationComplete: function () {
        this.showTooltip(this.segments, true);
    },
};

		var index= 0;
    }
}])
.controller('gradeGraphControllerC', ['$scope', '$timeout', 'graphMaster', function($scope, $timeout, graphMaster) {
	activate();
	function activate() {
		$scope.graphColors = [
		  '#5DA5DA',
		  '#FAA43A',
		  '#60BD68',
		  '#F17CB0',
		  '#B2912F',
		  '#B276B2',
		  '#DECF3F',
		  '#F15854',
		  '#4D4D4D'
    	];
		$scope.labels= graphMaster.gradeGraphLabelC;
		$scope.data= graphMaster.gradeGraphDataC;
    }
}]);
