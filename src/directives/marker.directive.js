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
