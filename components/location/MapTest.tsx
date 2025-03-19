import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '@/src/theme/ThemeProvider';

export const MapTest = () => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    console.log('MapTest Debug:', info);
    setDebugInfo(prev => [...prev, info]);
  };

  useEffect(() => {
    addDebugInfo(`Platform: ${Platform.OS} ${Platform.Version}`);
    addDebugInfo(`Using Google Maps Provider: ${Platform.OS === 'android'}`);
    addDebugInfo('Component mounted');

    return () => {
      addDebugInfo('Component unmounted');
    };
  }, []);

  const handleMapReady = () => {
    addDebugInfo('Map is ready');
    setMapLoaded(true);
    setIsLoading(false);
  };

  const handleMapError = (error: any) => {
    addDebugInfo('Map error occurred');
    
    if (error && typeof error === 'object') {
      if (error.message) {
        addDebugInfo(`Error message: ${error.message}`);
      }
      if (error.code) {
        addDebugInfo(`Error code: ${error.code}`);
      }
      Object.keys(error).forEach(key => {
        addDebugInfo(`Error property ${key}: ${error[key]}`);
      });
    } else {
      addDebugInfo(`Error: ${error}`);
    }
    
    setMapError('Failed to load map');
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={{ color: theme.colors.content.primary, marginTop: 10 }}>Loading map...</Text>
        </View>
      )}
      
      {mapError && (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.status.error.background + '20' }]}>
          <Text style={[styles.errorText, { color: theme.colors.status.error.content }]}>
            Error: {mapError}
          </Text>
          <Text style={{ color: theme.colors.content.secondary, marginTop: 8 }}>
            Please check the Google Maps API key configuration in the Google Cloud Console.
          </Text>
        </View>
      )}
      
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={{
            latitude: 37.7749,
            longitude: -122.4194,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onMapReady={handleMapReady}
          onError={handleMapError}
          liteMode={false}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
        />
      </View>
      
      {__DEV__ && (
        <View style={[styles.debugContainer, { backgroundColor: theme.colors.background.elevated }]}>
          <Text style={{ color: theme.colors.content.primary, fontWeight: 'bold' }}>Debug Info:</Text>
          {debugInfo.map((info, index) => (
            <Text key={index} style={{ color: theme.colors.content.secondary, fontSize: 12 }}>
              {info}
            </Text>
          ))}
        </View>
      )}
      
      {mapLoaded && (
        <View style={[styles.infoContainer, { backgroundColor: theme.colors.background.elevated }]}>
          <Text style={{ color: theme.colors.content.primary }}>✅ Map loaded successfully!</Text>
          <Text style={{ color: theme.colors.content.secondary, marginTop: 4 }}>
            Platform: {Platform.OS} {Platform.Version}
          </Text>
          <Text style={{ color: theme.colors.content.secondary }}>
            Provider: {Platform.OS === 'android' ? 'Google Maps' : 'Apple Maps'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mapContainer: {
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  errorContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  debugContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 12,
  }
}); 