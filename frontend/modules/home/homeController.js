'use strict';

angular.module('Home', ['ngMaterial', 'ngRoute'])

.controller('HomeController', [
	'$scope',
	'$location',
	'$timeout',
	'$routeParams',
	'$http',
	'$route',
	'MainService',
	'top',
	'champions',
function(
	$scope,
	$location,
	$timeout,
	$routeParams,
	$http,
	$route,
	MainService,
	top,
	champions) {

	var IMGURL = 'http://ddragon.leagueoflegends.com/cdn/6.8.1/img/champion/';

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
	console.log('mode', mode.slice(1));

	$scope.champList = results.data;
	$scope.championCount = $scope.champList.length;
	var max = results.max;

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

	//grab top 3 champions
	$scope.topChampions = $scope.champList.slice(0,3);

	//run circles
	runLevels();
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
		for (var i = 0; i < 100; i++) {
			$timeout(function() {
				$scope.champList.push({rank: 10, name: 'Blitzcrank',grade: 'A+',change: '0',changeDirection: 'up'});
			},1000);
		}


		scrollToBottom();
	}

	//smooth scroll to bottom of the main table
	function scrollToBottom() {
		$timeout(function() {
			var targetDiv = $('.table-listings');
			var height = targetDiv[0].scrollHeight;
  			targetDiv.animate({scrollTop:height});
  			$scope.loadingTable = false;
		}, 3000);
	}

	function executeOrder66() {
		$scope.noDataError = true;
		//log errors
	}


}]);
