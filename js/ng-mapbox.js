angular.module('ng-mapbox-example', [])
  .controller('MapboxController', function($scope, $q) {
    $scope.markers = [];

    this.addMarker = function(lat, lng) {
      // TODO: convert this to promises
      // timeout is hack around map not being available until mapboxMap link function
      setTimeout(function() {
        var marker = L.marker([lat, lng]).addTo($scope.map);
        $scope.markers.push(marker);
      }, 0);
    };
  })
  .directive('mapboxMap', function() {
    return {
      restrict: 'E',
      transclude: true,
      scope: {
        mapboxKey: '@',
        centerLat: '@',
        centerLng: '@',
        zoomLevel: '@',
      },
      controller: 'MapboxController',
      link: function($scope, $element, $attrs) {
        $scope.map = L.mapbox.map('ng-mapbox-map', $scope.mapboxKey);

        var zoomLevel = $scope.zoomLevel || 12;
        if($scope.centerLat && $scope.centerLng) {
          $scope.map.setView([$scope.centerLat, $scope.centerLng], zoomLevel);
        }
      },
      template: '<div id="ng-mapbox-map" ng-transclude></div>'
    }
  })
  .directive('mapboxMarker', function() {
    return {
      restrict: 'E',
      replace: true,
      require: '^mapboxMap',
      transclude: true,
      link: function($scope, $element, $attrs, mapController) {
        mapController.addMarker($attrs.lat, $attrs.lng);
      }
    }
  })
  ;
