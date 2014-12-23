(function() {
  'use strict';

  angular.module('angular-mapbox').service('mapboxService', mapboxService);

  function mapboxService() {
    var _mapInstances = [];

    var service = {
      init: init,
      getMapInstances: getMapInstances,
      addMapInstance: addMapInstance
    };
    return service;

    function init(opts) {
      if(!opts.accessToken) {
        throw 'MissingMapboxApiToken';
      }

      L.mapbox.accessToken = opts.accessToken;
    }

    function addMapInstance(map) {
      _mapInstances.push(map);
    }

    function getMapInstances() {
      return _mapInstances;
    }
  }
})();
