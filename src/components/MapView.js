import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';

// Only import WebView on native platforms - react-native-webview is not supported on web
let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

/**
 * Builds the Leaflet HTML string used on both web (iframe srcdoc) and native (WebView source).
 */
const buildLeafletHtml = (startLocation, destinationLocation, driverLocation) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
    <style>
      body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; background-color: #F3F4F6; }
      .driver-pin { display: flex; align-items: center; justify-content: center; }
      .driver-dot {
        width: 14px; height: 14px; background-color: #7C3AED;
        border: 3px solid #fff; border-radius: 50%;
        box-shadow: 0 0 8px rgba(124,58,237,0.6);
        position: relative; z-index: 10;
      }
      .driver-pulse {
        width: 36px; height: 36px; background-color: rgba(124,58,237,0.25);
        border-radius: 50%; position: absolute;
        animation: pulse 1.6s infinite ease-out; z-index: 1;
      }
      .dest-pin { display: flex; align-items: center; justify-content: center; }
      .dest-dot {
        width: 14px; height: 14px; background-color: #EF4444;
        border: 3px solid #fff; border-radius: 50%;
        box-shadow: 0 0 8px rgba(239,68,68,0.6);
      }
      .dest-pulse {
        width: 30px; height: 30px; background-color: rgba(239,68,68,0.15);
        border-radius: 50%; position: absolute;
        animation: pulse 2.2s infinite ease-in-out;
      }
      @keyframes pulse {
        0% { transform: scale(0.4); opacity: 1; }
        100% { transform: scale(1.6); opacity: 0; }
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map, driverMarker, destMarker, routeLine;
      var startLat = ${startLocation.latitude};
      var startLng = ${startLocation.longitude};
      var destLat  = ${destinationLocation.latitude};
      var destLng  = ${destinationLocation.longitude};
      var driverLat = ${driverLocation ? driverLocation.latitude : startLocation.latitude};
      var driverLng = ${driverLocation ? driverLocation.longitude : startLocation.longitude};

      function initMap() {
        map = L.map('map', { zoomControl: false, attributionControl: false });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

        var driverIcon = L.divIcon({
          className: 'driver-pin',
          html: '<div class="driver-dot"></div><div class="driver-pulse"></div>',
          iconSize: [36, 36], iconAnchor: [18, 18]
        });
        var destIcon = L.divIcon({
          className: 'dest-pin',
          html: '<div class="dest-dot"></div><div class="dest-pulse"></div>',
          iconSize: [30, 30], iconAnchor: [15, 15]
        });

        driverMarker = L.marker([driverLat, driverLng], { icon: driverIcon }).addTo(map);
        driverMarker.bindPopup('<b>Courier Position</b>').openPopup();
        destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
        destMarker.bindPopup('<b>Customer Address</b>');
        routeLine = L.polyline([[startLat, startLng],[destLat, destLng]], {
          color: '#7C3AED', weight: 4, opacity: 0.6, dashArray: '8, 8'
        }).addTo(map);
        fitBounds();

        // Notify parent (works for both postMessage and window listener)
        try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' })); } catch(e) {}
        try { window.parent.postMessage(JSON.stringify({ type: 'MAP_READY' }), '*'); } catch(e) {}
      }

      function fitBounds() {
        if (map && driverMarker && destMarker) {
          map.fitBounds(new L.featureGroup([driverMarker, destMarker]).getBounds().pad(0.15), { animate: true, duration: 1.2 });
        }
      }

      function updateLocation(lat, lng, statusText) {
        if (driverMarker) {
          driverMarker.setLatLng(new L.LatLng(lat, lng));
          var popup = '<b>Courier Position</b>' + (statusText ? '<br/><span style="color:#7C3AED;font-weight:bold;">' + statusText + '</span>' : '');
          driverMarker.bindPopup(popup);
          fitBounds();
        }
      }

      // Listen for coordinate update messages from parent (web iframe scenario)
      window.addEventListener('message', function(e) {
        try {
          var data = JSON.parse(e.data);
          if (data.type === 'UPDATE_LOCATION') {
            updateLocation(data.lat, data.lng, data.status);
          }
        } catch(err) {}
      });

      window.onload = initMap;
    <\/script>
  </body>
  </html>
`;

export const MapView = ({ startLocation, destinationLocation, driverLocation, orderStatus }) => {
  const webViewRef = useRef(null);
  const iframeRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const leafletHtml = buildLeafletHtml(startLocation, destinationLocation, driverLocation);

  // On web: listen for MAP_READY message from the iframe
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleWebMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'MAP_READY') {
          setMapReady(true);
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleWebMessage);
    return () => window.removeEventListener('message', handleWebMessage);
  }, []);

  // Update driver location when coordinates change
  useEffect(() => {
    if (!driverLocation) return;

    if (Platform.OS === 'web') {
      // Send location update to iframe via postMessage
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ type: 'UPDATE_LOCATION', lat: driverLocation.latitude, lng: driverLocation.longitude, status: orderStatus }),
          '*'
        );
      }
    } else {
      // Inject JavaScript into native WebView
      if (mapReady && webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `updateLocation(${driverLocation.latitude}, ${driverLocation.longitude}, "${orderStatus}"); true;`
        );
      }
    }
  }, [driverLocation, mapReady, orderStatus]);

  const handleNativeMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') setMapReady(true);
    } catch (e) {}
  };

  // ─── WEB PLATFORM: use a native HTML iframe ────────────────────────────────
  if (Platform.OS === 'web') {
    const srcDoc = leafletHtml;
    return (
      <View style={styles.container}>
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
          title="Delivery Map"
          onLoad={() => setMapReady(true)}
        />
        {!mapReady && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
          </View>
        )}
      </View>
    );
  }

  // ─── NATIVE PLATFORM: use react-native-webview ────────────────────────────
  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: leafletHtml }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleNativeMessage}
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
