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

