(function() {
  'use strict';

  angular.module('angular-mapbox').directive('featureLayer', function() {
    return {
      restrict: 'E',
      require: '^mapbox',
      link: function(scope, element, attrs, controller) {
        if(attrs.data) {
          controller.getMap().then(function(map) {
            var geojsonObject = scope.$eval(attrs.data);
            var featureLayer = L.mapbox.featureLayer(geojsonObject).addTo(map);
            controller.$scope.featureLayers.push(featureLayer);
          });
        } else if(attrs.url) {
          controller.getMap().then(function(map) {
            var featureLayer = L.mapbox.featureLayer().addTo(map);
            featureLayer.loadURL(attrs.url);
            controller.$scope.featureLayers.push(featureLayer);
          });
        }
      }
    };
  });
})();

