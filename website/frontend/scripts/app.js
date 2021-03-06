'use strict';

// declare modules
angular.module('Home', []);
angular.module('Dashboard', []);
angular.module('About', []);

angular.module('Compress', []).filter('compress', function() {
  return function(text) {
    return String(text).replace(/ /g,'');
  };
});
angular.module('CompressUnderline', []).filter('compressU', function() {
  return function(text) {
    return String(text).replace(/ /g, '_');
  };
});

angular.module('APIChallenge3', [
  'About',
  'Home',
  'Dashboard',
  'Compress',
  'CompressUnderline',
  'ngRoute'
])

.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

  $routeProvider
  .when('/', {
    templateUrl: 'modules/home/views/home.html',
    controller:'HomeController',
    resolve: {
        top: function(MainService) {
          return MainService.GetTop10Champions();
        },
        champions: function(MainService) {
          return MainService.GetChampionList();
        }
        //STORE CHAMPIONS!!
    }
  })

  .when('/dashboard', {
    templateUrl: 'modules/dashboard/tmpl.dashboard.html',
    controller:'DashboardController'
  })

  .when('/about', {
    templateUrl: 'modules/about/views/about.html'
  })

  .when('/home', {
    templateUrl: 'modules/home/views/home.html',
    controller:'HomeController',
    resolve: {
        top: function(MainService) {
          return MainService.GetTop10Champions();
        },
        champions: function(MainService) {
          return MainService.GetChampionList();
        }
    }
  })

  .otherwise({
    templateUrl: 'modules/home/views/home.html',
    controller:'HomeController',
    resolve: {
        top: function(MainService) {
          return MainService.GetTop10Champions();
        },
        champions: function(MainService) {
          return MainService.GetChampionList();
        }
    }
  });
}]);