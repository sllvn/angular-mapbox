angular.module('angularMapbox').directive('marker', function($compile) {
  return {
    restrict: 'E',
    require: '^mapbox',
    transclude: true,
    scope: true,
    link: function(scope, element, attrs, controller, transclude) {
      var opts = { draggable: attrs.draggable != undefined };
      var style = setStyleOptions(attrs);

      function setStyleOptions(attrs, default_opts) {
        var opts = default_opts || {};
        if(attrs.size) {
          opts['marker-size'] = attrs.size;
        }
        if(attrs.color) {
          opts['marker-color'] = attrs.color;
        }
        if(attrs.symbol) {
          opts['marker-symbol'] = attrs.symbol;
        }
        return opts;
      }

      var addMarker = function(map, latlng, popupContent, opts, style) {
        opts = opts || {}

        var marker = L.mapbox.marker.style({ properties: style }, latlng);
        if(popupContent && popupContent.length > 0) marker.bindPopup(popupContent);
        marker.addTo(map);

        // this needs to come after being added to map because the L.mapbox.marker.style() factory
        // does not let us pass other opts (eg, draggable) in
        if(opts.draggable) marker.dragging.enable();

        controller.$scope.markers.push(marker);
      };

      var removeMarker = function(map, latlng) {
        // TODO: this should be more robust, addMarker should return a reference to that marker so it can be removed
        // rather than removing markers at that latlng, because this will break if marker has been dragged and will remove
        // all markers at that latlng
        for(var i = 0; i < controller.$scope.markers.length; i++) {
          if(controller.$scope.markers[i].getLatLng().equals(L.latLng(latlng))) {
            map.removeLayer(controller.$scope.markers[i]);
            controller.$scope.markers.splice(i, 1);
            i--;
          }
        }
      };

      var addCurrentLocation = function(map, popupContent, opts, style) {
        var style = setStyleOptions(attrs, { 'marker-color': '#000', 'marker-symbol': 'star' });

        map.on('locationfound', function(e) {
          addMarker(map, [e.latlng.lat, e.latlng.lng], null, opts, style);
        });

        map.locate();
      }

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
            if(transcluded[i].outerHTML != undefined) popupHTML += transcluded[i].outerHTML;
          }

          if(attrs.currentLocation != undefined) {
            addCurrentLocation(map, null, opts, style);
          } else {
            var popup = angular.element(popupHTML);
            $compile(popup)(scope);
            if(!scope.$$phase) scope.$digest();

            var newPopupHTML = '';
            for(var i = 0; i < popup.length; i++) {
              newPopupHTML += popup[i].outerHTML;
            }

            addMarker(map, [attrs.lat, attrs.lng], newPopupHTML, opts, style);

            element.bind('$destroy', function() {
              removeMarker(map, [attrs.lat, attrs.lng]);
            });
          }
        }, 0);
      });
    }
  };
});

