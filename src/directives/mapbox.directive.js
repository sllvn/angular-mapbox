(function() {
  'use strict';

  angular.module('angular-mapbox').directive('mapbox', function($compile, $q, $parse, mapboxService) {
    var _mapboxMap;

    return {
      restrict: 'E',
      transclude: true,
      scope: true,
      replace: true,
      link: function(scope, element, attrs) {
        scope.map = L.mapbox.map(element[0], attrs.mapId);
        _mapboxMap.resolve(scope.map);
        var mapOptions = {
          clusterMarkers: attrs.clusterMarkers !== undefined,
          scaleToFit: attrs.scaleToFit !== undefined,
          scaleToFitAll: attrs.scaleToFit === 'all'
        };
        mapboxService.addMapInstance(scope.map, mapOptions);

        if (attrs.dragging === 'false') {
          scope.map.dragging.disable();
        }
        if (attrs.touchZoom === 'false') {
          scope.map.touchZoom.disable();
        }
        if (attrs.doubleClickZoom === 'false') {
          scope.map.doubleClickZoom.disable();
        }
        if (attrs.scrollWheelZoom === 'false') {
          scope.map.scrollWheelZoom.disable();
        }

        if (attrs.autoSize === undefined ) {
            var mapWidth = attrs.width || 500;
            var mapHeight = attrs.height || 500;

            if ( isNaN(mapWidth) ) {
              element.css('width', mapWidth);
            } else {
              element.css('width', mapWidth + 'px');
            }

            if ( isNaN(mapHeight) ) {
              element.css('height', mapHeight);
            } else {
              element.css('height', mapHeight + 'px');
            }
        }

        scope.zoom = attrs.zoom || 12;
        if(attrs.lat && attrs.lng) {
          scope.map.setView([attrs.lat, attrs.lng], scope.zoom);
        }

        if(attrs.onReposition) {
          var repositionFn = $parse(attrs.onReposition, null, true);
          scope.map.on('dragend', function(event) {
            scope.$apply(function() {
              repositionFn(scope, {$event:event});
            });
          });
        }

        if(attrs.onZoom) {
          var zoomFn = $parse(attrs.onZoom, null, true);
          scope.map.on('zoomend', function(event) {
            scope.$apply(function() {
              zoomFn(scope, {$event:event});
            });
          });
        }

        if(attrs.onClick) {
          var clickFn = $parse(attrs.onClick, null, true);
          scope.map.on('click', function(event) {
            scope.$apply(function() {
              clickFn(scope, {$event:event});
            });
          });
        }

        var refreshMap = function() {
          if (!attrs.lat || !attrs.lng || !attrs.zoom) {
            return;
          }
          scope.map.setView([attrs.lat, attrs.lng], attrs.zoom);
        };
        attrs.$observe('lat', refreshMap);
        attrs.$observe('lng', refreshMap);
        attrs.$observe('zoom', refreshMap);
      },
      template: '<div class="angular-mapbox-map" ng-transclude></div>',
      controller: function($scope, mapboxService) {
        $scope.markers = mapboxService.getMarkers();
        $scope.featureLayers = [];

        _mapboxMap = $q.defer();
        $scope.getMap = this.getMap = function() {
          return _mapboxMap.promise;
        };

        if(L.MarkerClusterGroup) {
          $scope.clusterGroup = new L.MarkerClusterGroup();
          this.getMap().then(function(map) {
            map.addLayer($scope.clusterGroup);
          });
        }

        this.$scope = $scope;
      }
    };
  });
})();
