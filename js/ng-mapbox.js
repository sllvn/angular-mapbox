angular.module('ng-mapbox-example', [])
  .directive('mapboxMap', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        centerLat: '=centerLat',
        centerLng: '=centerLng',
        zoomLevel: '=zoom',
        mapboxKey: '@mapboxKey'
      },
      link: function(scope, element, attrs) {
        scope.map = L.mapbox.map('ng-mapbox-map', attrs.mapboxKey);

        var zoomLevel = attrs.zoomLevel || 12;
        if(attrs.centerLat && attrs.centerLng) {
          scope.map.setView([attrs.centerLat, attrs.centerLng], zoomLevel);
        }
      },
      controller: function($scope) {
        // TODO: create event listeners for adding markers, showing popups, loading feature layers
      },
      template: '<div id="ng-mapbox-map"></div>'
    }
  });
