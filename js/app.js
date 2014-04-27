var angularMapboxExample = angular.module('angular-mapbox-example', ['angular-mapbox']);

angularMapboxExample.controller('geojsonController', function($scope) {
  $scope.geojsonData = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "name": "Sonic Boom Records",
          "address": "2209 NW Market St Seattle, WA 98107"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [
            -122.385041,
            47.66867
          ]
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Easy Street Records",
          "address": "4559 California Ave SW Seattle, WA 98116"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [
            -122.43679,
            47.561768
          ]
        }
      }
    ]
  };
});
