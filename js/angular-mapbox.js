var angularMapbox = angular.module('angular-mapbox', []);

angularMapbox.controller('MapboxController', function($scope) {
  $scope.markers = [];
  $scope.featureLayers = [];

  $scope.addMarker = function(lat, lng, popupContent, opts) {
    // timeout is hack around map not being available until mapboxMap link function
    setTimeout(function() {
      var marker = L.marker([lat, lng], opts).addTo($scope.map);
      if(popupContent && popupContent.length > 0) marker.bindPopup(popupContent);
      $scope.markers.push(marker);
    }, 0);
  };

  $scope.addCurrentLocation = function(popupContent, opts) {
    setTimeout(function() {
      $scope.map.locate();

      $scope.map.on('locationfound', function(e) {
        $scope.addMarker(e.latlng.lat, e.latlng.lng);
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

angularMapbox.directive('mapboxMap', function($compile) {
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
    link: function(scope, element, attrs) {
      scope.map = L.mapbox.map('ng-mapbox-map', scope.mapboxKey);

      var zoomLevel = scope.zoomLevel || 12;
      if(scope.centerLat && scope.centerLng) {
        scope.map.setView([scope.centerLat, scope.centerLng], zoomLevel);
      }

      scope.map.on('popupopen', function(e) {
        // ensure that popups are compiled
        var popup = angular.element(document.getElementsByClassName('leaflet-popup-content'));
        $compile(popup)(scope);
        if(!scope.$$phase) scope.$digest();
      });
    },
    template: '<div id="ng-mapbox-map" ng-transclude></div>'
  };
});

angularMapbox.directive('mapboxMarker', function($compile) {
  return {
    restrict: 'E',
    require: '^mapboxMap',
    transclude: true,
    link: function(scope, element, attrs, controller, transclude) {
      // there's got to be a better way to programmatically access transcluded content
      var popupHTML = '';
      var transcluded = transclude();
      for(var i = 0; i < transcluded.length; i++) {
        if(transcluded[i].outerHTML != undefined) popupHTML += transcluded[i].outerHTML;
      }
      var opts = { draggable: typeof attrs.draggable != 'undefined' };

      controller.$scope.addMarker(attrs.lat, attrs.lng, popupHTML, opts);
    }
  };
});

angularMapbox.directive('featureLayer', function() {
  return {
    restrict: 'E',
    require: '^mapboxMap',
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
    require: '^mapboxMap',
    link: function(scope, element, attrs, controller) {
      controller.$scope.addCurrentLocation();
    }
  };
});
