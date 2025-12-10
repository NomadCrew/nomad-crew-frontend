import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

// A minimal screen that renders a plain MapView with no logic or overlays.
// Navigate to /debug/bare-map in Expo Router to check whether the Google
// Maps SDK and API key are functioning independently of app logic.
export default function BareMap() {
  const region = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  React.useEffect(() => {
    if (__DEV__) {
      const key = "AIzaSyDHe3BXGmrEwdX2uQInmvmCl4hOelLDBfw";
      // print only last 6 chars to avoid full leak
      // eslint-disable-next-line no-console
      console.log('[BareMap] googleMaps apiKey loaded (last-6):', key?.slice(-6) || 'undefined');
    }
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 