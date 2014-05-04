var angularMapbox = angular.module('angular-mapbox', []);

angularMapbox.directive('mapbox', function($compile, $q) {
  var _mapboxMap;

  return {
    restrict: 'E',
    transclude: true,
    scope: true,
    link: function(scope, element, attrs) {
      scope.map = L.mapbox.map('angular-mapbox-map', attrs.mapId);
      _mapboxMap.resolve(scope.map);

      var zoomLevel = attrs.zoomLevel || 12;
      if(attrs.lat && attrs.lng) {
        scope.map.setView([attrs.lat, attrs.lng], zoomLevel);
      }
    },
    template: '<div id="angular-mapbox-map" ng-transclude></div>',
    controller: function($scope) {
      $scope.markers = [];
      $scope.featureLayers = [];

      _mapboxMap = $q.defer();
      $scope.getMap = this.getMap = function() {
        return _mapboxMap.promise;
      };

      $scope.addMarker = function(latlng, popupContent, opts, style) {
        $scope.getMap().then(function() {
          opts = opts || {}

          var marker = L.mapbox.marker.style({ properties: style }, latlng);
          if(popupContent && popupContent.length > 0) marker.bindPopup(popupContent);
          marker.addTo($scope.map);

          // this needs to come after being added to map because
          // unfortunately, the L.mapbox.marker.style() factory
          // does not let us pass other opts (eg, draggable) in
          if(opts.draggable) marker.dragging.enable();

          $scope.markers.push(marker);
        });
      };

      $scope.addCurrentLocation = function(popupContent, opts, style) {
        $scope.getMap().then(function() {
          $scope.map.locate();

          $scope.map.on('locationfound', function(e) {
            $scope.addMarker([e.latlng.lat, e.latlng.lng], null, opts, style);
          });
        });
      }

      $scope.addFeatureLayer = function(geojsonObject) {
        $scope.getMap().then(function() {
          var featureLayer = L.mapbox.featureLayer(geojsonObject).addTo($scope.map);
          $scope.featureLayers.push(featureLayer);
        });
      };

      $scope.addFeatureLayerFromUrl = function(url) {
        $scope.getMap().then(function() {
          var featureLayer = L.mapbox.featureLayer().addTo($scope.map);
          featureLayer.loadURL(url);
          $scope.featureLayers.push(featureLayer);
        });
      };

      $scope.removeMarker = function(latlng) {
        $scope.getMap().then(function() {
          // TODO: this should be more robust, addMarker should return a reference to that marker so it can be removed
          // rather than removing markers at that latlng, because this will break if marker has been dragged and will remove
          // all markers at that latlng
          for(var i = 0; i < $scope.markers.length; i++) {
            if($scope.markers[i].getLatLng().equals(L.latLng(latlng))) {
              $scope.map.removeLayer($scope.markers[i]);
              $scope.markers.splice(i, 1);
              i--;
            }
          }
        });
      };

      this.$scope = $scope;
    }
  };
});

angularMapbox.directive('marker', function($compile) {
  return {
    restrict: 'E',
    require: '^mapbox',
    transclude: true,
    scope: true,
    link: function(scope, element, attrs, controller, transclude) {
      var opts = { draggable: typeof attrs.draggable != 'undefined' };
      var style = setStyleOptions(attrs);

      // there's got to be a better way to programmatically access transcluded content
      var popupHTML = '';
      var transcluded = transclude(scope, function() {});
      for(var i = 0; i < transcluded.length; i++) {
        if(transcluded[i].outerHTML != undefined) popupHTML += transcluded[i].outerHTML;
      }

      setTimeout(function() {
        controller.$scope.map.on('popupopen', function(e) {
          // ensure that popups are compiled
          var popup = angular.element(document.getElementsByClassName('leaflet-popup-content'));
          $compile(popup)(scope);
          if(!scope.$$phase) scope.$digest();
        });

        var popup = angular.element(popupHTML);
        $compile(popup)(scope);
        if(!scope.$$phase) scope.$digest();
        var newPopupHTML = '';
        for(var i = 0; i < popup.length; i++) {
          newPopupHTML += popup[i].outerHTML;
        }
        controller.$scope.addMarker([attrs.lat, attrs.lng], newPopupHTML, opts, style);

        element.bind('$destroy', function() {
          controller.$scope.removeMarker([attrs.lat, attrs.lng]);
        });
      }, 0);
    }
  };
});

function setStyleOptions(attrs, default_opts) {
  var opts = default_opts || {};
  if(attrs.size) {
    opts['marker-size'] = attrs.size;
  }
  if(attrs.color) {
    opts['marker-color'] = attrs.color;
  }
  if(attrs.symbol) {
    opts['marker-symbol'] = attrs.symbol;
  }
  return opts;
}

angularMapbox.directive('featureLayer', function() {
  return {
    restrict: 'E',
    require: '^mapbox',
    link: function(scope, element, attrs, controller) {
      if(attrs.data) {
        controller.$scope.addFeatureLayer(scope.$eval(attrs.data));
      } else if(attrs.url) {
        controller.$scope.addFeatureLayerFromUrl(attrs.url);
      }
    }
  };
});

angularMapbox.directive('currentLocation', function() {
  return {
    restrict: 'E',
    require: '^mapbox',
    link: function(scope, element, attrs, controller) {
      var style = setStyleOptions(attrs, { 'marker-color': '#000', 'marker-symbol': 'star-stroked' });
      controller.$scope.addCurrentLocation(null, null, style);
    }
  };
});
