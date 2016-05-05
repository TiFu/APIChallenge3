'use strict';

angular.module('Home')

.factory('MainService', ['$http', function($http) {
  var service = {};

  service.GetTop10Champions = function(callback) {
    return $http.post('/api/top10/champions');
  };

  return service;
}]);
