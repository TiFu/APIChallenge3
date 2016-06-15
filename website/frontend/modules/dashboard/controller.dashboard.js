'use strict';

angular.module('Dashboard', ['ngMaterial', 'ngRoute', 'chart.js'])

.controller('DashboardController', ['$scope','$timeout',
  function($scope,$timeout) {

    $scope.isViewLoading = true;
    $scope.search = search;
    $scope.user = {
      name: '',
      region: ''
    };
    $scope.loadingText = 'Champion Mastery is Loading...';
    $scope.regions = [{name: 'br'},{name: 'eune'},{name: 'euw'},{name: 'kr'},{name: 'lan'},{name: 'las'},{name: 'na'},{name: 'oce'},{name: 'ru'},{name: 'tr' }]
    
    activate();

    function activate() {
      showStep1();
    }

    function showStep1() {
      $scope.user.region = $scope.regions[6].name;
      $timeout(function() {
        $('.loader').fadeOut(1000,function(){
          $('.step-1').fadeIn(1000);
        });
      }, 1000);
    }

    function search() {
      if (_.isEmpty($scope.user.name)) {
        return;
      }
      $scope.step1lock = true;
      $scope.loadingText = 'Searching for Summoner...';
      $('.step-1').fadeOut(1000,function(){
        $('.loader').fadeIn(1000, function() {
          $('.loader').fadeOut(1000, function() {
            $('.step-2').fadeIn(1000);
          })
        });
      });
    }

}]);
