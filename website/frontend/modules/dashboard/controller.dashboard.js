'use strict';

angular.module('Dashboard', ['ngMaterial', 'ngRoute', 'chart.js'])

.controller('DashboardController', ['$scope','$location','$timeout','$routeParams','$http','$route','$mdToast',
  function($scope,$location,$timeout,$routeParams,$http,$route,$mdToast) {


    //will run when event queue for this controller has settled down

    $scope.isViewLoading = true;
    $scope.search = search;
    $scope.user = {
      name: ''
    };
    $scope.loadingText = 'Champion Mastery is Loading...';
    activate();

    function activate() {
      //showStep1();
      $timeout(function() {
      $('.loader').hide();
      $('.step-1').show();
    },1000);
    }

    function showStep1() {
      $timeout(function() {
        $('.loader').fadeOut(1500,function(){
          $('.step-1').fadeIn(1500);
        });
      }, 1500);
    }

    function search() {
      $scope.loadingText = 'Searching for Summoner...';
      $('.step-1').fadeOut(1500,function(){
        $('.loader').fadeIn(1500);
      });
    }

}]);
