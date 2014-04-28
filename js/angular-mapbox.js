var angularMapbox = angular.module('angular-mapbox', []);

angularMapbox.controller('MapboxController', function($scope, $q) {
  $scope.markers = [];
  $scope.featureLayers = [];

  this.addMarker = function(lat, lng, opts, popupContent) {
    // TODO: convert this to promises
    // timeout is hack around map not being available until mapboxMap link function
    setTimeout(function() {
      var marker = L.marker([lat, lng], opts).addTo($scope.map);
      if(popupContent.length > 0)marker.bindPopup(popupContent);
      $scope.markers.push(marker);
    }, 0);
  };

  this.addFeatureLayer = function(geojsonObject) {
    setTimeout(function() {
      var featureLayer = L.mapbox.featureLayer(geojsonObject).addTo($scope.map);
      $scope.featureLayers.push(featureLayer);
    }, 0);
  };

  this.addFeatureLayerFromUrl = function(url) {
    setTimeout(function() {
      var featureLayer = L.mapbox.featureLayer().addTo($scope.map);
      featureLayer.loadURL(url);
      $scope.featureLayers.push(featureLayer);
    }, 0);
  };
});

angularMapbox.directive('mapboxMap', function() {
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
});

angularMapbox.directive('mapboxMarker', function($compile) {
  return {
    restrict: 'E',
    require: '^mapboxMap',
    transclude: true,
    link: function(scope, element, attrs, controller, transclude) {
      // TODO: there's got to be a better way to programmatically access transcluded content
      var popupHTML = '';
      var transcluded = transclude();
      for(var i = 0; i < transcluded.length; i++) {
        if(transcluded[i].outerHTML != undefined) popupHTML += transcluded[i].outerHTML;
      }
      var opts = { draggable: typeof attrs.draggable != 'undefined' };
      // TODO: compile popupHTML
      debugger;
      controller.addMarker(attrs.lat, attrs.lng, opts, popupHTML);
    }
  }
});

angularMapbox.directive('featureLayer', function() {
  return {
    restrict: 'E',
    require: '^mapboxMap',
    link: function(scope, element, attrs, controller) {
      if(attrs.data) {
        controller.addFeatureLayer(scope.$eval(attrs.data));
      } else if(attrs.url) {
        controller.addFeatureLayerFromUrl(attrs.url);
      }
    }
  }
});
