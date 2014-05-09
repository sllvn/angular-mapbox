angular.module('angularMapbox', []).directive('mapbox', function($compile, $q) {
  var _mapboxMap;

  return {
    restrict: 'E',
    transclude: true,
    scope: true,
    replace: true,
    link: function(scope, element, attrs) {
      scope.map = L.mapbox.map(element[0], attrs.mapId);
      _mapboxMap.resolve(scope.map);

      var zoom = attrs.zoom || 12;
      if(attrs.lat && attrs.lng) {
        scope.map.setView([attrs.lat, attrs.lng], zoom);
      }
    },
    template: '<div class="angular-mapbox-map" ng-transclude></div>',
    controller: function($scope) {
      $scope.markers = [];
      $scope.featureLayers = [];

      _mapboxMap = $q.defer();
      $scope.getMap = this.getMap = function() {
        return _mapboxMap.promise;
      };

      this.$scope = $scope;
    }
  };
});

