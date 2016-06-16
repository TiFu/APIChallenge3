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
      showStep1();    }

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
            $('.step-2').fadeIn(1000, function() {
              $(window).resize();
              $('#highchart').highcharts().reflow();
            });
          });
        });
      });
    }
}])


/****************
 * HIGHCHARTJS
 ***************/
.controller('highChartController', ['$scope', '$timeout', function($scope, $timeout) {
  activate();

  function activate() {
      $('#highchart').highcharts({
        chart: {
          type: 'bar',
          backgroundColor: 'transparent'
        },
        title: {
          text: 'Fruit Consumption'
        },
        xAxis: {
          categories: ['Apples', 'Bananas', 'Oranges']
        },
        yAxis: {
          title: {
            text: 'Fruit eaten'
          }
        },
        series: [{
          name: 'Jane',
          data: [1, 0, 4]
        }, {
          name: 'John',
          data: [5, 7, 3]
        }]
      });
  }

}])


/****************
 * JQVMAP
 ***************/
.controller('regionMapController', ['$scope', '$timeout', function($scope, $timeout) {
  activate();

  function activate() {
    $('#vmap').vectorMap({
      map: 'world_en',
      backgroundColor: '#333333',
      color: '#ffffff',
      hoverOpacity: 0.2,
      selectedColor: '#666666',
      enableZoom: false,
      showTooltip: true,
      onLabelShow: function(event, label, code) {
        console.log(label)
      },
      onRegionOver: function(element, code, region) {
        highlightRegionOfCountry(code);
      },
      onRegionOut: function(element, code, region) {
        unhighlightRegionOfCountry(code);
      }
    });

    //setup region colors
    $timeout(function() {
    _.forOwn(LoLRegions, function(region) {
      console.log('region: ' + region.name);
      _.each(region.countries, function(country) {
        if (!!doesCountryExist(country)) {
          $('#vmap').vectorMap('set', 'colors', country, region.colors);
          console.log('colored: ' + country);
        } else {
          console.log('missing: ' + country);
        }
      });
    });
    }, 0);
  }



  function doesCountryExist(country) {
    return _.find(COUNTRYLIST, function(val) {
      return val === country;
    });
  }


  //List of all current countries registered in the library
  var COUNTRYLIST = ["id", "pg", "mx", "ee", "dz", "ma", "mr", "sn", "gm", "gw", "gn", "sl", "lr", "ci", "ml", "bf", "ne", "gh", "tg", "bj", "ng", "tn", "ly", "eg", "td", "sd", "cm", "er", "dj", "et", "so", "ye", "cf", "st", "gq", "ga", "cg", "ao", "cd", "rw", "bi", "ug", "ke", "tz", "zm", "mw", "mz", "zw", "na", "bw", "sz", "ls", "za", "gl", "au", "nz", "nc", "my", "bn", "tl", "sb", "vu", "fj", "ph", "cn", "tw", "jp", "ru", "us", "mu", "re", "mg", "km", "sc", "mv", "pt", "es", "cv", "pf", "kn", "ag", "dm", "lc", "bb", "gd", "tt", "do", "ht", "fk", "is", "no", "lk", "cu", "bs", "jm", "ec", "ca", "gt", "hn", "sv", "ni", "cr", "pa", "co", "ve", "gy", "sr", "gf", "pe", "bo", "py", "uy", "ar", "cl", "br", "bz", "mn", "kp", "kr", "kz", "tm", "uz", "tj", "kg", "af", "pk", "in", "np", "bt", "bd", "mm", "th", "kh", "la", "vn", "ge", "am", "az", "ir", "tr", "om", "ae", "qa", "kw", "sa", "sy", "iq", "jo", "lb", "il", "cy", "gb", "ie", "se", "fi", "lv", "lt", "by", "pl", "it", "fr", "nl", "be", "de", "dk", "ch", "cz", "sk", "at", "hu", "si", "hr", "ba", "mt", "ua", "md", "ro", "rs", "bg", "al", "mk", "gr"];


  //Region list - based on random in chat guy
  //
  // DOUBLE CHECK THIS STUFF TINO THANKS!
  //
  var LoLRegions = {
    'br': {
      'countries': ["br"],
      'name': 'brazil',
      'colors': '#46BCDE'
    },
    'eune': {
      'countries': ["al", "am", "az", "bh", "by", "ba", "bg", "cr", "cy", "cz", "dk", "eg", "ee", "fo", "fi", "ge", "gr", "gr", "hu", "is", "ir", "iq", "il", "jo", "kz", "xk", "kw", "kg", "lv", "lb", "mk", "md", "me", "no", "om", "ps", "pl", "qa", "ro", "sa", "rs", "sk", "si", "sj", "se", "sy", "tj", "tm", "ua", "ae", "uz", "ye"],
      'name': 'europe nordic & east',
      'colors': '#52D273'
    },
    'euw': {
      'countries': ["dz", "ad", "at", "be", "bj", "bf", "cm", "cf", "td", "dj", "fr", "ga", "gm", "de", "gh", "gi", "gn", "ie", "it", "ci", "li", "lu", "mg", "mw", "mt", "mu", "mc", "ma", "na", "nl", "ne", "pt", "cg", "sm", "sc", "sl", "za", "es", "sd", "ss", "ch", "tg", "tn", "gb", "va", "zm"],
      'name': 'europe west',
      'colors': '#E94F64'
    },
    'lan': {
      'countries': ["gf", "sr", "gy", "ve", "co", "ec", "pe", "aw", "cw", "gd", "tt", "bb", "vc", "lc", "mq", "dm", "gp", "ms", "kn", "ai", "vg", "vi"],
      'name': 'latin america north',
      'colors': '#52D273'
    },
    'las': {
      'countries': ["bo", "cl", "py", "ar", "uy", "fk"],
      'name': 'latin america south',
      'colors': '#EFC454'
    },
    'na': {
      'countries': ["us", "ca", "mx", "gt", "ni", "cr", "pa", "cu", "do", "pr"],
      'name': 'north america',
      'colors': '#E57254'
    },
    'oce': {
      'countries': ["au", "nz", "gu", "nc", "pf", "fj", "mp"],
      'name': 'oceania',
      'colors': '#46BCDE'
    },
    'ru': {
      'countries': ["ru"],
      'name': 'russia',
      'colors': '#EfC454'
    },
    'tr': {
      'countries': ["tr"],
      'name': 'turkey',
      'colors': '#E57254'
    },
    'jp': {
      'countries': ["jp"],
      'name': 'japan',
      'colors': '#52D273'
    },
    'kr': {
      'countries': ["kr"],
      'name': 'republic of korea',
      'colors': '#E94F64'
    }
  };


  function getCountriesInRegion(cc) {
    var region = { countries: '' };
    for (var regionKey in LoLRegions) {
      var countries = LoLRegions[regionKey].countries;
      _.forOwn(countries, function(key, countryIndex) {
        if (cc == countries[countryIndex]) {
          region = LoLRegions[regionKey];
          return LoLRegions[regionKey];
        }
      });
    }
    return region;
  }

  function highlightRegionOfCountry(cc) {
    var countries = getCountriesInRegion(cc).countries;
    _.forOwn(countries, function(key, countryIndex) {
      $('#vmap').vectorMap('highlight', countries[countryIndex]);
    });
    $('#vmap').vectorMap('highlight', cc);
  }

  function unhighlightRegionOfCountry(cc) {
    var countries = getCountriesInRegion(cc).countries;
    _.forOwn(countries, function(key, countryIndex) {
      $('#vmap').vectorMap('unhighlight', countries[countryIndex]);
    });
    $('#vmap').vectorMap('unhighlight', cc);
  }

}]);