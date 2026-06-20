import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export const MapView = ({ startLocation, destinationLocation, driverLocation, orderStatus }) => {
  const webViewRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Generate the HTML for Leaflet
  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          background-color: #F3F4F6;
        }
        
        /* Driver icon styling */
        .driver-pin {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .driver-dot {
          width: 14px;
          height: 14px;
          background-color: #7C3AED;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(124, 58, 237, 0.6);
          position: relative;
          z-index: 10;
        }
        .driver-pulse {
          width: 36px;
          height: 36px;
          background-color: rgba(124, 58, 237, 0.25);
          border-radius: 50%;
          position: absolute;
          animation: pulse 1.6s infinite ease-out;
          z-index: 1;
        }
        
        /* Destination icon styling */
        .dest-pin {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dest-dot {
          width: 14px;
          height: 14px;
          background-color: #EF4444;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
        }
        .dest-pulse {
          width: 30px;
          height: 30px;
          background-color: rgba(239, 68, 68, 0.15);
          border-radius: 50%;
          position: absolute;
          animation: pulse 2.2s infinite ease-in-out;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.4);
            opacity: 1;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map;
        var driverMarker;
        var destMarker;
        var routeLine;
        
        var startLat = ${startLocation.latitude};
        var startLng = ${startLocation.longitude};
        var destLat = ${destinationLocation.latitude};
        var destLng = ${destinationLocation.longitude};
        var initialDriverLat = ${driverLocation ? driverLocation.latitude : startLocation.latitude};
        var initialDriverLng = ${driverLocation ? driverLocation.longitude : startLocation.longitude};

        function initMap() {
          // Initialize map
          map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          });

          // OpenStreetMap tile layer (clean light style)
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
          }).addTo(map);

          // Custom Icons
          var driverIcon = L.divIcon({
            className: 'driver-pin',
            html: '<div class="driver-dot"></div><div class="driver-pulse"></div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          var destIcon = L.divIcon({
            className: 'dest-pin',
            html: '<div class="dest-dot"></div><div class="dest-pulse"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          // Add Markers
          driverMarker = L.marker([initialDriverLat, initialDriverLng], { icon: driverIcon }).addTo(map);
          driverMarker.bindPopup("<b>Courier Position</b>").openPopup();
          
          destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
          destMarker.bindPopup("<b>Customer Address</b>");

          // Draw Route Polyline
          routeLine = L.polyline([
            [startLat, startLng],
            [destLat, destLng]
          ], {
            color: '#7C3AED',
            weight: 4,
            opacity: 0.6,
            dashArray: '8, 8'
          }).addTo(map);

          // Fit bounds
          fitBounds();
          
          // Notify React Native that Map is fully loaded
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
        }

        function fitBounds() {
          if (map) {
            var group = new L.featureGroup([driverMarker, destMarker]);
            map.fitBounds(group.getBounds().pad(0.15), {
              animate: true,
              duration: 1.2
            });
          }
        }

        function updateLocation(lat, lng, statusText) {
          if (driverMarker) {
            var newLatLng = new L.LatLng(lat, lng);
            driverMarker.setLatLng(newLatLng);
            
            // Re-bind dynamic status popups
            var popupContent = "<b>Courier Position</b>";
            if (statusText) {
              popupContent += "<br/><span style='color:#7C3AED; font-weight:bold;'>" + statusText + "</span>";
            }
            driverMarker.bindPopup(popupContent);
            
            // Pan map to keep driver centered but showing both if close,
            // or just center smoothly. Let's do fit bounds so both remain visible.
            fitBounds();
          }
        }

        window.onload = initMap;
      </script>
    </body>
    </html>
  `;

  // Listen to message updates when driverLocation changes
  useEffect(() => {
    if (mapReady && driverLocation && webViewRef.current) {
      const code = `updateLocation(${driverLocation.latitude}, ${driverLocation.longitude}, "${orderStatus}");`;
      webViewRef.current.injectJavaScript(code);
    }
  }, [driverLocation, mapReady, orderStatus]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        setMapReady(true);
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: leafletHtml }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        originWhitelist={['*']}
      />
      {!mapReady && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  webView: {
    flex: 1,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
