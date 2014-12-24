(function() {
  'use strict';

  angular.module('angular-mapbox').service('mapboxService', mapboxService);

  function mapboxService() {
    var _mapInstances = [],
        _markers = [],
        _mapOptions = [];

    var service = {
      init: init,
      getMapInstances: getMapInstances,
      addMapInstance: addMapInstance,
      getMarkers: getMarkers,
      addMarker: addMarker
    };
    return service;

    function init(opts) {
      if(!opts.accessToken) {
        throw 'MissingMapboxApiToken';
      }

      L.mapbox.accessToken = opts.accessToken;
    }

    function addMapInstance(map, mapOptions) {
      mapOptions = mapOptions || {};

      _mapInstances.push(map);
      _mapOptions.push(mapOptions);
    }

    function getMapInstances() {
      return _mapInstances;
    }

    function addMarker(marker) {
      // TODO: tie markers to specific map instance
      _markers.push(marker);
    }

    function getMarkers() {
      return _markers;
    }
  }
})();
