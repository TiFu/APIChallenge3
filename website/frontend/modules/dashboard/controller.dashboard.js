'use strict';

angular.module('Dashboard', ['ngMaterial', 'ngRoute', 'chart.js'])

.controller('DashboardController', ['$scope','$location','$timeout','$routeParams','$http','$route','$mdToast',
  function($scope,$location,$timeout,$routeParams,$http,$route,$mdToast) {


    //will run when event queue for this controller has settled down
    $scope.isViewLoading = true;
    activate();

    function activate() {
      console.log('we loaded');

      //$timeout(function() {$scope.isViewLoading = false;}, 1500);
    }

}]);
