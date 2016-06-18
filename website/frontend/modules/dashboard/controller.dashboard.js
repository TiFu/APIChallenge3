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

    //text you see above loading bar
    $scope.loadingText = 'Champion Mastery is Loading...';
    //dropdown list of regions on search screen
    $scope.regions = [{name: 'br'},{name: 'eune'},{name: 'euw'},{name: 'kr'},{name: 'lan'},{name: 'las'},{name: 'na'},{name: 'oce'},{name: 'ru'},{name: 'tr' }]

    activate();

    //page loaded
    function activate() {
      showStep1();    }

    //ease in search bar
    function showStep1() {
      $scope.user.region = $scope.regions[6].name;
      $timeout(function() {
        $('.loader').fadeOut(1000,function(){
          $('.step-1').fadeIn(1000);
        });
      }, 1000);
    }

    //search bar fired, ease in step 2.
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

  //example/sample
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
 * JQVMAP - World Map
 ***************/
.controller('regionMapController', ['$scope', '$timeout', function($scope, $timeout) {
  activate();

  function activate() {
    $('#vmap').vectorMap({
      map: 'world_en',
      backgroundColor: '#333333',
      color: '#D3D3D3',
      hoverOpacity: 0.7,
      hoverColor: '#337ab7',
      enableZoom: false,
      showTooltip: true,
      onLabelShow: function(event, label, code) {
        console.log(label, code);
        label[0].innerHTML = getRegionFromCountry(code);
      },
      onRegionOver: function(event, code, region) {
        if (highlightRegionOfCountry(code, event)) {
          //show highlight
        } else {
          //don't show highlight
          event.preventDefault();
        }
      },
      onRegionOut: function(element, code, region) {
        unhighlightRegionOfCountry(code);
      },
      onRegionClick: function(event, code, region) {
        event.preventDefault();
      }
    });

    //color the regions
    $timeout(function() {
    _.forOwn(LoLRegions, function(region) {
      console.log('region: ' + region.name);
      _.each(region.countries, function(country) {
        if (_.isEmpty(doesCountryExist(country))) {
          console.log('missing: ' + country);
        } else {
          $('#vmap').vectorMap('set', 'colors', country, region.colors);
          console.log('colored: ' + country);
        }
      });
    });

    //leftovers, make remaing countries grayed out
    LoLRegions['noserver'].countries = COUNTRYLIST;
    _.each(LoLRegions['noserver'].countries, function(country) {
      if (_.isEmpty(doesCountryExist(country))) {
          console.log('missing: ' + country);
        } else {
          $('#vmap').vectorMap('set', 'colors', country, LoLRegions['noserver'].colors);
          console.log('colored: ' + country);
        }
      });
    }, 0);
  }

  //check if country exists in COUNTRYLIST, then remove it.
  function doesCountryExist(country) {
    return _.remove(COUNTRYLIST, function(val) {
      return val === country;
    });
  }

  //List of all current countries registered in the library
  var COUNTRYLIST = ["tm", "gr", "lu", "aw", "cw", "mq", "gu", "mp", "cr", "bh", "id", "pg", "mx", "ee", "mr", "sn", "gm", "gw", "lr", "ml", "tg", "ng","ly", "er", "dj", "et", "so", "ye", "st", "gq", "ao", "cd", "rw", "bi", "ug", "ke", "tz", "mz", "zw", "bw", "sz", "ls", "gl", "au", "nz", "nc", "my", "bn", "tl", "sb", "vu", "fj", "ph", "cn", "tw", "jp", "ru", "us", "re", "km", "mv", "pt", "es", "cv", "pf", "kn", "ag", "dm", "lc", "bb", "gd", "tt", "do", "ht", "fk", "no", "lk", "cu", "bs", "jm", "ec", "ca", "gt", "hn", "sv", "ni", "cr", "pa", "co", "ve", "gy", "sr", "gf", "pe", "bo", "py", "uy", "ar", "cl", "br", "bz", "mn", "kp", "kr", "kz", "uz", "af", "pk", "in", "np", "bt", "bd", "mm", "th", "kh", "la", "vn", "ge", "am", "az", "tr", "om", "ae", "qa", "kw", "sy", "iq", "il", "gb", "ie", "se", "fi", "lv", "lt", "by", "pl", "it", "fr", "nl", "be", "de", "dk", "ch", "cz", "sk", "at", "hu", "si", "hr", "ba", "mt", "ua", "md", "ro", "rs", "bg", "al", "mk"];


  //Visual LoL Region List
  var LoLRegions = {
    'br': {
      'countries': ["br"],
      'name': 'brazil',
      'colors': '#46BCDE'
    },
    'eune': {
      'countries': ["hr", "lt", "al", "by", "ba", "bg", "cr", "cz", "dk", "ee", "fi", "gr", "hu", "lv", "mk", "md", "no", "pl", "ro", "rs", "sk", "si", "se", "ua"],
      'name': 'europe nordic & east',
      'colors': '#52D273'
    },
    'euw': {
        'countries': ["at", "be", "dj", "fr", "gm", "de", "ie", "it", "mt", "nl", "pt", "es", "ch", "tg", "gb"],
      'name': 'europe west',
      'colors': '#E94F64'
    },
    'lan': {
      'countries': ["hn", "bs", "ht", "do", "jm", "cr", "cu", "pa", "ni", "mx", "gf", "gt",  "sr", "gy", "ve", "co", "ec", "pe", "gd", "tt", "bb", "lc", "dm", "kn", "ag"],
      'name': 'latin america north',
      'colors': '#52D273'
    },
    'las': {
      'countries': ["bo", "cl", "py", "ar", "uy", "fk"],
      'name': 'latin america south',
      'colors': '#EFC454'
    },
    'na': {
      'countries': ["us", "ca"],
      'name': 'north america',
      'colors': '#E57254'
    },
    'oce': {
      'countries': ["au", "nz", "nc", "pf", "fj"],
      'name': 'oceania',
      'colors': '#46BCDE'
    },
    'ru': {
      'countries': ["ru", "kz", "uz", "tm"],
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
    },
    'noserver': {
      'countries': [],
      'name': 'noserver',
      'colors': '#D3D3D3'
    }
  };

//get Region by Country
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

  //get Region Name by Country
  function getRegionFromCountry(cc) {
    var region;
    for (var regionKey in LoLRegions) {
      var countries = LoLRegions[regionKey].countries;
      _.forOwn(countries, function(key, countryIndex) {
        if (cc == countries[countryIndex]) {
          region = LoLRegions[regionKey];
          return LoLRegions[regionKey];
        }
      });
    }

    //if no region, set name to noserver
    if (!region) {
      region = {name: 'noserver'};
    }
    return region.name;
  }

  //when hovered over country, highlight its region
  //return true = highlight, return false = no highlight
  function highlightRegionOfCountry(cc) {
    var region = getCountriesInRegion(cc);
    var countries = region.countries;

    //no server countries - dont higlight
    if (!region.name || region.name === 'noserver') {
      return false;
    } else {
      //find all countries to highlight
     _.forOwn(countries, function(key, countryIndex) {
        $('#vmap').vectorMap('highlight', countries[countryIndex]);
     });
     $('#vmap').vectorMap('highlight', cc);
        return true;
     }
  }

  //when mouse leave, unhighlight region
  function unhighlightRegionOfCountry(cc) {
    var countries = getCountriesInRegion(cc).countries;
    _.forOwn(countries, function(key, countryIndex) {
      $('#vmap').vectorMap('unhighlight', countries[countryIndex]);
    });
    $('#vmap').vectorMap('unhighlight', cc);
  }

}]);
