(function() {
  'use strict';

  angular.module('angular-mapbox').service('mapboxService', mapboxService);

  function mapboxService() {
    var _mapInstances = [];

    var service = {
      getMapInstances: getMapInstances,
      addMapInstance: addMapInstance
    };
    return service;

    function addMapInstance(map) {
      _mapInstances.push(map);
    }

    function getMapInstances() {
      return _mapInstances;
    }
  }
})();
