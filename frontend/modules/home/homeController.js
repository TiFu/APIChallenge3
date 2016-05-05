'use strict';

angular.module('Home', ['ngMaterial', 'ngRoute'])

.controller('HomeController', [
	'$scope',
	'$location',
	'$timeout',
	'$routeParams',
	'$http',
	'MainService',
	'top',
function(
	$scope,
	$location,
	$timeout,
	$routeParams,
	$http,
	MainService,
	top) {

	//will run when event queue for this controller has settled down
	activate();

	function activate() {
	var mode = getCurrentRequest();
	//print all but first param which is home, will return us our pathing request.
	//i.e. if mode = ['home','graves','brand'], will print graves, brand. For path of Home/Graves/Brand
	console.log('mode', mode.slice(1));

	$scope.champList = top.data;
	$scope.champList = $scope.champList.map(function(champ) {
		champ.changeDirection = 'up';
		champ.masteryAverage = 70;
		champ.currentAverage = 0;
		return champ;
	});

	console.log('champion list', $scope.champList);
	$scope.topChampions = $scope.champList.slice(0,3);
	console.log('top Champions', $scope.topChampions);
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

	//selecting a champion/summoner should generically path to a new url.
	//will trigger a new query when the controller re-loads.
	$scope.goto = function(champ) {
		$location.path('/home/'+champ);
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


}]);
