angular.module('angularMapbox', []);


angular.module('angularMapbox').directive('featureLayer', function() {
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


angular.module('angularMapbox').directive('mapbox', function($compile, $q) {
  var _mapboxMap;

  return {
    restrict: 'E',
    transclude: true,
    scope: true,
    replace: true,
    link: function(scope, element, attrs) {
      scope.map = L.mapbox.map(element[0], attrs.mapId);
      _mapboxMap.resolve(scope.map);

      var mapWidth = attrs.width || 500;
      var mapHeight = attrs.height || 500;
      element.css('width', mapWidth + 'px');
      element.css('height', mapHeight + 'px');

      var zoom = attrs.zoom || 12;
      if(attrs.lat && attrs.lng) {
        scope.map.setView([attrs.lat, attrs.lng], zoom);
      }

      scope.isClusteringMarkers = attrs.clusterMarkers !== undefined;

      var shouldRefitMap = attrs.scaleToFit !== undefined;
      scope.fitMapToMarkers = function() {
        if(!shouldRefitMap) return;
        // TODO: only call this after all markers have been added, instead of per marker add

        var group = new L.featureGroup(scope.markers);
        scope.map.fitBounds(group.getBounds());
      };

      if(attrs.onReposition) {
        scope.map.on('dragend', function() {
          scope[attrs.onReposition](scope.map.getBounds());
        });
      }

      if(attrs.onZoom) {
        scope.map.on('zoomend', function() {
          scope[attrs.onZoom](scope.map.getBounds());
        });
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


angular.module('angularMapbox').directive('marker', function($compile) {
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
    link: function(scope, element, attrs, controller, transclude) {
      var opts = { draggable: attrs.draggable !== undefined };
      var style = setStyleOptions(attrs);
      var marker;

      function setStyleOptions(attrs, default_opts) {
        var opts = default_opts || {};
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

      var addMarker = function(map, latlng, popupContent, opts, style) {
        opts = opts || {};

        var marker = L.mapbox.marker.style({ properties: style }, latlng);
        if(popupContent && popupContent.length > 0) marker.bindPopup(popupContent);

        if(controller.$scope.isClusteringMarkers && opts.excludeFromClustering !== true) {
          controller.$scope.clusterGroup.addLayer(marker);
        } else {
          marker.addTo(map);
        }

        // this needs to come after being added to map because the L.mapbox.marker.style() factory
        // does not let us pass other opts (eg, draggable) in
        if(opts.draggable) marker.dragging.enable();

        controller.$scope.markers.push(marker);
        controller.$scope.fitMapToMarkers();

        return marker;
      };

      var addCurrentLocation = function(map, popupContent, opts, style) {
        style = setStyleOptions(style, { 'marker-color': '#000', 'marker-symbol': 'star' });
        opts.excludeFromClustering = true;

        map.on('locationfound', function(e) {
          marker = addMarker(map, [e.latlng.lat, e.latlng.lng], null, opts, style);
        });

        map.locate();
      };

      controller.getMap().then(function(map) {
        map.on('popupopen', function(e) {
          // ensure that popups are compiled
          var popup = angular.element(document.getElementsByClassName('leaflet-popup-content'));
          $compile(popup)(scope);
          if(!scope.$$phase) scope.$digest();
        });

        setTimeout(function() {
          // there's got to be a better way to programmatically access transcluded content
          var popupHTML = '';
          var transcluded = transclude(scope, function() {});
          for(var i = 0; i < transcluded.length; i++) {
            if(transcluded[i].outerHTML !== undefined) popupHTML += transcluded[i].outerHTML;
          }

          if(attrs.currentLocation !== undefined) {
            addCurrentLocation(map, null, opts, style);
          } else {
            if(popupHTML) {
              var popup = angular.element(popupHTML);
              $compile(popup)(scope);
              if(!scope.$$phase) scope.$digest();

              var newPopupHTML = '';
              for(i = 0; i < popup.length; i++) {
                newPopupHTML += popup[i].outerHTML;
              }

              marker = addMarker(map, [attrs.lat, attrs.lng], newPopupHTML, opts, style);
            } else {
              marker = addMarker(map, [attrs.lat, attrs.lng], null, opts, style);
            }

            element.bind('$destroy', function() {
              if(controller.$scope.isClusteringMarkers) {
                controller.$scope.clusterGroup.removeLayer(marker);
              } else {
                map.removeLayer(marker);
              }
            });
          }
        }, 0);
      });
    }
  };
});

