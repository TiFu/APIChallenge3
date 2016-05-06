'use strict';

angular.module('Home')

.factory('MainService', ['$http', function($http) {
  var service = {};

  service.GetTop10Champions = function() {
    return $http.post('/api/top10/champions');
  };

  service.GetChampionList = function() {
    return $http.get('/api/static/champions', {cache: true});
  }

  return service;
}]);
