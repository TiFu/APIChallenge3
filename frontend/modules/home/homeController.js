'use strict';

angular.module('Home', ['ngMaterial', 'ngRoute'])

.controller('HomeController', ['$scope', '$location', '$timeout', '$routeParams', function($scope, $location, $timeout, $routeParams) {
	
	var mode = $location.path().split('/');
	mode.shift();
	$scope.mode = mode.length;
	console.log(mode);
	$scope.champList = [
		{
			rank: 0,
			name: 'Aatrox',
			grade: 'S+',
			change: '5',
			changeDirection: 'up'
		},
		{
			rank: 1,
			name: 'Akali',
			grade: 'S+',
			change: '0',
			changeDirection: 'up'
		},
		{
			rank: 2,
			name: 'Annie',
			grade: 'S-',
			change: '1',
			changeDirection: 'up'
		},
		{
			rank: 3,
			name: 'Rengar',
			grade: 'A+',
			change: '5',
			changeDirection: 'up'
		},
		{
			rank: 4,
			name: 'Blitzcrank',
			grade: 'A+',
			change: '0',
			changeDirection: 'up'
		},
		{
			rank: 5,
			name: 'Amumu',
			grade: 'A-',
			change: '3',
			changeDirection: 'down'
		},
		{
			rank: 6,
			name: 'Teemo',
			grade: 'B+',
			change: '2',
			changeDirection: 'down'
		},
		{
			rank: 7,
			name: 'Brand',
			grade: 'C',
			change: '2',
			changeDirection: 'up'
		},
		{
			rank: 8,
			name: 'Alistar',
			grade: 'D',
			change: '3',
			changeDirection: 'down'
		},
		{
			rank: 9,
			name: 'Swain',
			grade: 'D',
			change: '2',
			changeDirection: 'up'
		}
	];
	

	$scope.topChampions = [
		{
			name: 'Aatrox',
			masteryAverage: 70,
			currentAverage: 0
		},
		{
			name: 'Akali',
			masteryAverage: 60,
			currentAverage: 0
		},
		{
			name: 'Annie',
			masteryAverage: 30,
			currentAverage: 0
		}
	];

	runLevels();

	function runLevels() {
		champ1Circle();
		champ2Circle();
		champ3Circle();
	}


	function champ1Circle() {
		if ($scope.topChampions[0].currentAverage > $scope.topChampions[0].masteryAverage) {
			return;
		}
			$scope.topChampions[0].currentAverage++;
			$timeout(champ1Circle, 15);		
	}

	function champ2Circle() {
		if ($scope.topChampions[1].currentAverage > $scope.topChampions[1].masteryAverage) {
			return;
		}
			$scope.topChampions[1].currentAverage++;
			$timeout(champ2Circle, 15);		
	}

	function champ3Circle() {
		if ($scope.topChampions[2].currentAverage > $scope.topChampions[2].masteryAverage) {
			return;
		}
			$scope.topChampions[2].currentAverage++;
			$timeout(champ3Circle, 15);		
	}

	$scope.goto = function(champ) {
		$location.path('/home/'+champ);
	}

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

	function scrollToBottom() {
		$timeout(function() {
			var targetDiv = $('.table-listings');
			var height = targetDiv[0].scrollHeight;
  			targetDiv.scrollTop(height);
  			$scope.loadingTable = false;
		}, 3000);
	}

}]);
