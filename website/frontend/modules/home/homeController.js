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

	var IMGURL = 'http://ddragon.leagueoflegends.com/cdn/6.8.1/img/champion/';
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

	if (mode.length === 1) {
		$scope.viewMode = 'Main';
		runMainView(mode, results);
	} else if (mode.length === 2 && _.find(champions.data, { 'name': mode[1]})) {
				$scope.viewMode = 'Champion';
				var id = _.find(champions.data, { 'name': mode[1]}).id;
				searchForChampion(id);
			} else {
				$scope.viewMode = 'Summoner';
				searchForPlayer(mode[1]);
			}	
}

function runSummonerView(data) {
	if (!data.success) {
		executeOrder66();
		return;
	}

	$scope.summonerData = data;
	$scope.champList = data.top10champions;
	//updateChampionSpinners(21333);

	//graph level data
	$scope.summonerData.levelGraph = _.map($scope.summonerData.masterydistribution.distribution, function(value, key) {
		return {labels: 'Level ' + key, data: value}
	});

	$scope.summonerData.levelGraph.labels = [];
	$scope.summonerData.levelGraph.data = [];

	_.each($scope.summonerData.levelGraph, function(mastery) {
		$scope.summonerData.levelGraph.labels.push(mastery.labels);
		$scope.summonerData.levelGraph.data.push(mastery.data);
	});


	//graph grades
	$scope.summonerData.gradeGraph = _.filter($scope.summonerData.highestgradedistribution, 'grade');
	$scope.summonerData.gradeGraph = _.map($scope.summonerData.gradeGraph, function(value, key) {
		return {labels: 'Grade ' + value['grade'], data: value['cnt']}
	});

	$scope.summonerData.gradeGraph.labels = [];
	$scope.summonerData.gradeGraph.data = [];

	_.each($scope.summonerData.gradeGraph, function(mastery) {
		$scope.summonerData.gradeGraph.labels.push(mastery.labels);
		$scope.summonerData.gradeGraph.data.push(mastery.data);
	});

	//push graph data onto graphMaster
    graphMaster.levelGraphLabel = $scope.summonerData.levelGraph.labels;
    graphMaster.levelGraphData = $scope.summonerData.levelGraph.data;
    graphMaster.gradeGraphLabel = $scope.summonerData.gradeGraph.labels;
	graphMaster.gradeGraphData = $scope.summonerData.gradeGraph.data;
	//show graphs
	$scope.lotsGraphReady = true;

	$scope.topChampions = $scope.champList.slice(0,3);
}

function runChampionView(data) {
	if (_.isEmpty(data)) {
		executeOrder66();
		return;
	}

	$scope.championData = data;
	console.log($scope.championData)
		//graph level data
	$scope.championData.levelGraph = _.map($scope.championData.masterydistribution.distribution, function(value, key) {
		return {labels: 'Level ' + key, data: value}
	});

	$scope.championData.levelGraph.labels = [];
	$scope.championData.levelGraph.data = [];

	_.each($scope.championData.levelGraph, function(mastery) {
		$scope.championData.levelGraph.labels.push(mastery.labels);
		$scope.championData.levelGraph.data.push(mastery.data);
	});


	//graph grades
	$scope.championData.gradeGraph = _.filter($scope.championData.highestgradedistribution, 'grade');
	$scope.championData.gradeGraph = _.map($scope.championData.gradeGraph, function(value, key) {
		return {labels: 'Grade ' + value['grade'], data: value['cnt']}
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
}

function runMainView(mode, results) {
	$scope.champList = results.data;
	$scope.championCount = champions.length;
	var max = results.max;

	updateChampionInfo(max);

	//grab top 3 champions
	$scope.topChampions = $scope.champList.slice(0,3);

	//run circles
	runLevels();
}

function updateChampionInfo(max) {
	$scope.champList = $scope.champList.map(function(champ) {
		//get a 1 thru 100% of where this champ is compared to highest champ score.
		champ.masteryAverage = (champ.points / max)*100;
		champ.currentAverage = 0;

		//roud points
		champ.points = Math.ceil(champ.points);
		champ.pointsChange = Math.ceil(champ.pointsChange);

		//add points direction and remove +/-
		champ.pointsChangeDirection = champ.pointsChange < 0 ? 'down' : 'up'
		champ.pointsChange = champ.pointsChange.toString().replace(/-/g, '');
		//handle NaN
		champ.pointsChange = champ.pointsChange.toString() === 'NaN' ? 0 : champ.pointsChange;

		//add rank direction and remove +/-
		champ.rankChangeDirection = champ.rankChange < 0 ? 'down' : 'up'		
		champ.rankChange = champ.rankChange.toString().replace(/-/g, '');
		//handle NaN
		champ.rankChange = champ.rankChange.toString() === 'NaN' ? 0 : champ.rankChange;

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
		if ($scope.topChampions[0].currentAverage > $scope.topChampions[0].masteryAverage) {
			return;
		}
			$scope.topChampions[0].currentAverage++;
			$timeout(champ1Circle, 15);

	}

	//champion 2's circle animation
	function champ2Circle() {
		if ($scope.topChampions[1].currentAverage > $scope.topChampions[1].masteryAverage) {
			return;
		}
			$scope.topChampions[1].currentAverage++;
			$timeout(champ2Circle, 15);
	}

	//champion 3's circle animation
	function champ3Circle() {
		if ($scope.topChampions[2].currentAverage > $scope.topChampions[2].masteryAverage) {
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
		$scope.searchingGlobally = true;
		$location.path('/home/'+$scope.globalSearch);
		$scope.globalSearch = '';
	}
	$scope.globalSearch = 'TSM MeNoHaxor';

	function searchForPlayer(summonerName) {
		console.log('searching for player');
		MainService.getPlayerInfo(summonerName)
		.success(function(result) {
			runSummonerView(result);
		})
		.catch(function(result) {
			console.log('alarm');
			soundTheAlarm('Could not find summoner!');
		});
	}


	function searchForChampion(id) {
		MainService.getChampionInfo(id)
		.success(function(result) {
			runChampionView(result);
		})
		.catch(function(result) {
			console.log('alarm');
			soundTheAlarm('Could not find champion!');
		});
	}

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
		$scope.labels= graphMaster.gradeGraphLabel;
		$scope.data= graphMaster.gradeGraphData;
    }
}])
.controller('gradeGraphController', ['$scope', '$timeout', 'graphMaster', function($scope, $timeout, graphMaster) {
	activate();
	function activate() {
		$scope.labels= graphMaster.levelGraphLabel;
		$scope.data= graphMaster.levelGraphData;
    }
}])
.controller('levelGraphControllerC', ['$scope', '$timeout', 'graphMaster', function($scope, $timeout, graphMaster) {
	activate();
	function activate() {
		$scope.labels= graphMaster.levelGraphLabelC;
		$scope.data= graphMaster.levelGraphDataC;
    }
}])
.controller('gradeGraphControllerC', ['$scope', '$timeout', 'graphMaster', function($scope, $timeout, graphMaster) {
	activate();
	function activate() {
		$scope.labels= graphMaster.gradeGraphLabelC;
		$scope.data= graphMaster.gradeGraphDataC;
    }
}]);
