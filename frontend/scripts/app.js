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
    templateUrl: 'Modules/home/views/home.html'
  })

  .when('/about', {
    templateUrl: 'Modules/about/views/about.html',
  })

  .when('/home', {
    templateUrl: 'Modules/home/views/home.html'
  })

  .otherwise({
    templateUrl: 'Modules/home/views/home.html',
  })

/*  .otherwise({
    redirectTo: '/home'
  });*/

}]);