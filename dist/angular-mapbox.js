(function() {
  'use strict';

  angular.module('angular-mapbox', []);
})();


(function() {
  'use strict';

  angular.module('angular-mapbox').service('mapboxService', mapboxService);

  function mapboxService() {
    var _mapInstances = [],
        _markers = [],
        _mapOptions = [];

    var fitMapToMarkers = debounce(function() {
      // TODO: refactor
      var map = _mapInstances[0];
      var group = new L.featureGroup(getMarkers());
      map.fitBounds(group.getBounds());
    }, 0);

    var service = {
      init: init,
      getMapInstances: getMapInstances,
      addMapInstance: addMapInstance,
      getMarkers: getMarkers,
      addMarker: addMarker,
      removeMarker: removeMarker,
      fitMapToMarkers: fitMapToMarkers,
      getOptionsForMap: getOptionsForMap
    };
    return service;

    function init(opts) {
      opts = opts || {};
      L.mapbox.accessToken = opts.accessToken;
    }

    function addMapInstance(map, mapOptions) {
      mapOptions = mapOptions || {};

      _mapInstances.push(map);
      _mapOptions.push(mapOptions);
      _markers.push([]);
    }

    function getMapInstances() {
      return _mapInstances;
    }

    function addMarker(marker) {
      // TODO: tie markers to specific map instance
      var map = getMapInstances()[0];
      _markers[0].push(marker);

      var opts = getOptionsForMap(map);
      if(opts.scaleToFit) {
        fitMapToMarkers(map);
      }
    }

    function removeMarker(map, marker) {
      map.removeLayer(marker);

      var markerIndexToRemove;
      for(var i = 0, markers = getMarkers(); markers[i]; i++) {
        if(markers[i]._leaflet_id === marker._leaflet_id) {
          markerIndexToRemove = i;
        }
      }
      markers.splice(markerIndexToRemove, 1);

      var opts = getOptionsForMap(map);
      if(opts.scaleToFit && opts.scaleToFitAll) {
        fitMapToMarkers(map);
      }
    }

    // TODO: move to utils
    function debounce(func, wait, immediate) {
      var timeout;

      return function() {
        var context = this,
            args = arguments;

        var later = function() {
          timeout = null;
          if (!immediate) {
            func.apply(context, args);
          }
        };

        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
          func.apply(context, args);
        }
      };
    }

    function getMarkers() {
      return _markers[0];
    }

    function getOptionsForMap(map) { // jshint ignore:line
      // TODO: get options for specific map instance
      return _mapOptions[0];
    }
  }
})();

(function() {
  'use strict';

  angular.module('angular-mapbox').directive('featureLayer', function() {
    return {
      restrict: 'E',
      require: '^mapbox',
      link: function(scope, element, attrs, controller) {
        var featureLayer;
        controller.getMap().then(function(map) {
          if(attrs.data) {
            var geojsonObject = scope.$eval(attrs.data);
            featureLayer = L.mapbox.featureLayer(geojsonObject).addTo(map);
          } else if(attrs.url) {
            featureLayer = L.mapbox.featureLayer().addTo(map);
            featureLayer.loadURL(attrs.url);
          }
          if (featureLayer) {
            controller.$scope.featureLayers.push(featureLayer);
            element.bind('$destroy', function() {
              map.removeLayer(featureLayer);
              controller.$scope.featureLayers.pop(featureLayer);
            });
          }
        });
      }
    };
  });
})();

(function() {
    'use strict';

    angular.module('angular-mapbox').directive('htmlMarker', function($compile, $timeout, mapboxService) {
        var _colors = {
            navy: '#001f3f',
            blue: '#0074d9',
            aqua: '#7fdbff',
            teal: '#39cccc',
            olive: '#3d9970',
            green: '#2ecc40',
            lime: '#01ff70',
            yellow: '#ffdc00',
            orange: '#ff851b',
            red: '#ff4136',
            fuchsia: '#f012be',
            purple: '#b10dc9',
            maroon: '#85144b',
            white: 'white',
            silver: '#dddddd',
            gray: '#aaaaaa',
            black: '#111111'
        };

        return {
            restrict: 'E',
            require: '^mapbox',
            transclude: true,
            scope: true,
            link: link
        };

        function link(scope, element, attrs, controller, transclude) {
            var _marker, _opts, _style;

            _opts = { draggable: attrs.draggable !== undefined,
                      className:  attrs.className,
                      displayText: attrs.displayText,
                      width: attrs.width,
                      height:  attrs.height
            };
            _style = setStyleOptions(attrs);

            controller.getMap().then(function(map) {
                transclude(scope, function(transcludedContent) {
                    var popupContentElement;

                    if(transcludedContent !== null && transcludedContent.length > 0) {
                        popupContentElement = document.createElement('span');
                        for(var i = 0; i < transcludedContent.length; i++) {
                            popupContentElement.appendChild(transcludedContent[i]);
                        }
                    }

                    if(attrs.currentLocation !== undefined) {
                        _style = setStyleOptions(_style, { 'marker-color': '#000', 'marker-symbol': 'star' });
                        _opts.excludeFromClustering = true;

                        map.on('locationfound', function(e) {
                            _marker = addMarker(scope, map, [e.latlng.lat, e.latlng.lng], popupContentElement, _opts, _style);
                        });

                        map.locate();
                    } else {
                        _marker = addMarker(scope, map, [attrs.lat, attrs.lng], popupContentElement, _opts, _style);
                    }
                });

                element.bind('$destroy', function() {
                    if(mapboxService.getOptionsForMap(map).clusterMarkers) {
                        scope.clusterGroup.removeLayer(_marker);
                    } else {
                        mapboxService.removeMarker(map, _marker);
                    }
                });
            });
        }

        function setStyleOptions(attrs, defaultOpts) {
            var opts = defaultOpts || {};
            if(attrs.size) {
                opts['marker-size'] = attrs.size;
            }
            if(attrs.color) {
                if(attrs.color[0] === '#') {
                    opts['marker-color'] = attrs.color;
                } else {
                    opts['marker-color'] = _colors[attrs.color] || attrs.color;
                }
            }
            if(attrs.icon) {
                opts['marker-symbol'] = attrs.icon;
            }
            return opts;
        }

        function addMarker(scope, map, latlng, popupContent, opts) {
            opts = opts || {};

            var marker = L.marker(latlng, {
                icon: L.divIcon({
                    // Specify a class name we can refer to in CSS.
                    className: opts.className,
                    // Define what HTML goes in each marker.
                    html: opts.displayText,
                    // Set a markers width and height.
                    iconSize: [opts.width, opts.height]
                })
            });

            if(popupContent) {
                marker.bindPopup(popupContent);
            }

            if(mapboxService.getOptionsForMap(map).clusterMarkers && opts.excludeFromClustering !== true) {
                scope.clusterGroup.addLayer(marker);
            } else {
                marker.addTo(map);
            }

            // this needs to come after being added to map because the L.mapbox.marker.style() factory
            // does not let us pass other opts (eg, draggable) in
            if(opts.draggable) {
                marker.dragging.enable();
            }

            mapboxService.addMarker(marker);

            return marker;
        }
    });
})();

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

(function() {
  'use strict';

  angular.module('angular-mapbox').directive('marker', function($compile, $timeout, $parse, mapboxService) {
    var _colors = {
      navy: '#001f3f',
      blue: '#0074d9',
      aqua: '#7fdbff',
      teal: '#39cccc',
      olive: '#3d9970',
      green: '#2ecc40',
      lime: '#01ff70',
      yellow: '#ffdc00',
      orange: '#ff851b',
      red: '#ff4136',
      fuchsia: '#f012be',
      purple: '#b10dc9',
      maroon: '#85144b',
      white: 'white',
      silver: '#dddddd',
      gray: '#aaaaaa',
      black: '#111111'
    };

    return {
      restrict: 'E',
      require: '^mapbox',
      transclude: true,
      scope: true,
      link: link
    };

    function link(scope, element, attrs, controller, transclude) {
      var _marker, _opts, _style;

      _opts = { draggable: attrs.draggable !== undefined };
      _style = setStyleOptions(attrs);

      controller.getMap().then(function(map) {
        transclude(scope, function(transcludedContent) {
          var popupContentElement;
          if(transcludedContent !== null && transcludedContent.length > 0) {
            popupContentElement = document.createElement('span');
            for(var i = 0; i < transcludedContent.length; i++) {
              popupContentElement.appendChild(transcludedContent[i]);
            }
          }

          if(attrs.currentLocation !== undefined) {
            _style = setStyleOptions(_style, { 'marker-color': '#000', 'marker-symbol': 'star' });
            _opts.excludeFromClustering = true;

            map.on('locationfound', function(e) {
              _marker = addMarker(scope, map, [e.latlng.lat, e.latlng.lng], popupContentElement, _opts, _style);
            });

            map.locate();
          } else {
            _marker = addMarker(scope, map, [attrs.lat, attrs.lng], popupContentElement, _opts, _style);

            if(attrs.onClick) {
              var clickFn = $parse(attrs.onClick, null, true);
              _marker.on('click', function() {
                scope.$apply(function() {
                  clickFn(scope, {$event:event});
                });
              });
            }
          }
        });

        element.bind('$destroy', function() {
          if(mapboxService.getOptionsForMap(map).clusterMarkers) {
            scope.clusterGroup.removeLayer(_marker);
          } else {
            mapboxService.removeMarker(map, _marker);
          }
        });
      });
    }

    function setStyleOptions(attrs, defaultOpts) {
      var opts = defaultOpts || {};
      if(attrs.size) {
        opts['marker-size'] = attrs.size;
      }
      if(attrs.color) {
        if(attrs.color[0] === '#') {
          opts['marker-color'] = attrs.color;
        } else {
          opts['marker-color'] = _colors[attrs.color] || attrs.color;
        }
      }
      if(attrs.icon) {
        opts['marker-symbol'] = attrs.icon;
      }
      return opts;
    }

    function addMarker(scope, map, latlng, popupContent, opts, style) {
      opts = opts || {};

      var marker = L.mapbox.marker.style({ properties: style }, latlng);
      if(popupContent) {
        marker.bindPopup(popupContent);
      }

      if(mapboxService.getOptionsForMap(map).clusterMarkers && opts.excludeFromClustering !== true) {
        scope.clusterGroup.addLayer(marker);
      } else {
        marker.addTo(map);
      }

      // this needs to come after being added to map because the L.mapbox.marker.style() factory
      // does not let us pass other opts (eg, draggable) in
      if(opts.draggable) {
        marker.dragging.enable();
      }

      mapboxService.addMarker(marker);

      return marker;
    }
  });
})();
