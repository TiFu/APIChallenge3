'use strict';

// declare modules
angular.module('Home', []);
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
        }
        //STORE CHAMPIONS!!
    }  
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
        }
    }
  })

  .otherwise({
    templateUrl: 'modules/home/views/home.html',
    controller:'HomeController',
    resolve: {
        top: function(MainService) {
          return MainService.GetTop10Champions();
        }
    }  
  })

/*  .otherwise({
    redirectTo: '/home'
  });*/

}]);
