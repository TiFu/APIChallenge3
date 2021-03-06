'use strict';

angular.module('Home')

.factory('MainService', ['$http', function($http) {
  var service = {};

  service.GetTop10Players = function() {
    return $http.post('/api/top10/players');
  }

  service.GetAllPlayers = function() {
    return $http.post('/api/top10/players/all');    
  }
  service.GetTop10Champions = function() {
    return $http.post('/api/top10/champions');
  };

  service.GetAllChampions = function() {
    return $http.post('/api/top10/champions/all');
  };

  service.GetChampionList = function() {
    return $http.get('/api/static/champions', {cache: true});
  }

  service.getPlayerInfo = function(name) {
  	return $http.post('api/player/info/by-name/'+name.trim());
  }

  service.getChampionInfo = function(id) {
  	return $http.post('api/champion/'+id);
  }

  service.getChampionAndPlayerInfo = function(summonerid, championid) {
  	return $http.post('api/player/progression/'+championid+'/'+summonerid);
  }

  return service;
}]);
