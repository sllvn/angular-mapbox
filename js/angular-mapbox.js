var angularMapbox = angular.module('angular-mapbox', []);

angularMapbox.controller('MapboxController', function($scope) {
  $scope.markers = [];
  $scope.featureLayers = [];

  $scope.addMarker = function(latlng, popupContent, opts, style) {
    // setTimeout is hack around map not being available until mapboxMap link function
    // all setTimeout hacks in this are to be replaced with promise resolving on mapready
    setTimeout(function() {
      opts = opts || {}

      var marker = L.mapbox.marker.style({ properties: style }, latlng);
      if(popupContent && popupContent.length > 0) marker.bindPopup(popupContent);
      marker.addTo($scope.map);

      // this needs to come after being added to map because
      // unfortunately, the L.mapbox.marker.style() factory
      // does not let us pass other opts (eg, draggable) in
      if(opts.draggable) marker.dragging.enable();

      $scope.markers.push(marker);
    }, 0);
  };

  $scope.addCurrentLocation = function(popupContent, opts, style) {
    setTimeout(function() {
      $scope.map.locate();

      $scope.map.on('locationfound', function(e) {
        $scope.addMarker([e.latlng.lat, e.latlng.lng], null, opts, style);
      });
    }, 0);
  }

  $scope.addFeatureLayer = function(geojsonObject) {
    setTimeout(function() {
      var featureLayer = L.mapbox.featureLayer(geojsonObject).addTo($scope.map);
      $scope.featureLayers.push(featureLayer);
    }, 0);
  };

  $scope.addFeatureLayerFromUrl = function(url) {
    setTimeout(function() {
      var featureLayer = L.mapbox.featureLayer().addTo($scope.map);
      featureLayer.loadURL(url);
      $scope.featureLayers.push(featureLayer);
    }, 0);
  };

  this.$scope = $scope;
});

angularMapbox.directive('mbMap', function($compile) {
  return {
    restrict: 'E',
    transclude: true,
    scope: true,
    controller: 'MapboxController',
    link: function(scope, element, attrs) {
      scope.map = L.mapbox.map('ng-mapbox-map', attrs.mapboxKey);

      var zoomLevel = attrs.zoomLevel || 12;
      if(attrs.centerLat && attrs.centerLng) {
        scope.map.setView([attrs.centerLat, attrs.centerLng], zoomLevel);
      }
    },
    template: '<div id="ng-mapbox-map" ng-transclude></div>'
  };
});

angularMapbox.directive('mbMarker', function($compile) {
  return {
    restrict: 'E',
    require: '^mbMap',
    transclude: true,
    scope: true,
    link: function(scope, element, attrs, controller, transclude) {
      var opts = { draggable: typeof attrs.draggable != 'undefined' };
      var style = setStyleOptions(attrs);

      // there's got to be a better way to programmatically access transcluded content
      var popupHTML = '';
      var transcluded = transclude();
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
        window.popup = popup;
        var newPopupHTML = '';
        for(var i = 0; i < popup.length; i++) {
          newPopupHTML += popup[i].outerHTML;
        }
        controller.$scope.addMarker([attrs.lat, attrs.lng], newPopupHTML, opts, style);
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

angularMapbox.directive('mbFeatureLayer', function() {
  return {
    restrict: 'E',
    require: '^mbMap',
    link: function(scope, element, attrs, controller) {
      if(attrs.data) {
        controller.$scope.addFeatureLayer(scope.$eval(attrs.data));
      } else if(attrs.url) {
        controller.$scope.addFeatureLayerFromUrl(attrs.url);
      }
    }
  };
});

angularMapbox.directive('mbCurrentLocation', function() {
  return {
    restrict: 'E',
    require: '^mbMap',
    link: function(scope, element, attrs, controller) {
      var style = setStyleOptions(attrs, { 'marker-color': '#000', 'marker-symbol': 'star-stroked' });
      controller.$scope.addCurrentLocation(null, null, style);
    }
  };
});
