import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, InteractionManager, Platform, Pressable, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useLocationStore } from '@/src/store/useLocationStore';
import { useAuthStore } from '@/src/features/auth/store';
import { Trip } from '@/src/features/trips/types';
import { AlertCircle, Info } from 'lucide-react-native';
import { LocationSharingToggle } from './LocationSharingToggle';
import { Surface } from 'react-native-paper';
import { Theme } from '@/src/theme/types';
import { LiveLocation, UserLocation } from '@/src/types/location';

const DEFAULT_COORDINATES = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

interface GroupLiveMapProps {
  trip: Trip;
  onClose: () => void;
  isStandalone?: boolean;
}

export const GroupLiveMap: React.FC<GroupLiveMapProps> = ({ trip, onClose, isStandalone = false }) => {
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);
  const { user } = useAuthStore();
  const {
    isLocationSharingEnabled,
    currentLocation,
    memberLocations,
    startLocationTracking,
    stopLocationTracking,
    getMemberLocations,
    locationError
  } = useLocationStore();

  const [region, setRegion] = useState<Region>({
    latitude: trip.destination.coordinates?.lat || DEFAULT_COORDINATES.latitude,
    longitude: trip.destination.coordinates?.lng || DEFAULT_COORDINATES.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapLoadAttempts, setMapLoadAttempts] = useState<number>(0);

  const tripMemberLocations = memberLocations[trip.id] || {};
  const memberLocationArray = Object.values(tripMemberLocations);

  useEffect(() => {
    if (isLocationSharingEnabled) {
      startLocationTracking(trip.id);
    }

    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        await getMemberLocations(trip.id);
      } catch (error) {
        setMapError('Unable to fetch member locations.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();

    const intervalId = setInterval(() => {
      if (isLocationSharingEnabled) {
        getMemberLocations(trip.id).catch(() => {});
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [trip.id, isLocationSharingEnabled]);

  useEffect(() => {
    if (currentLocation && isLocationSharingEnabled) {
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [currentLocation, isLocationSharingEnabled]);

  // Ensure we have valid coordinates initially
  useEffect(() => {
    if (trip.destination.coordinates?.lat !== undefined && trip.destination.coordinates?.lng !== undefined) {
      setRegion({
        latitude: trip.destination.coordinates.lat,
        longitude: trip.destination.coordinates.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      console.log('[MapDebug] Map ready called, coordinates:', JSON.stringify(trip.destination.coordinates));
    }
  }, [trip.id]);

  const fitToMarkers = () => {
    const markers: { latitude: number; longitude: number }[] = [];

    if (memberLocationArray.length > 0) {
      markers.push(...memberLocationArray.map(m => ({
        latitude: m.location.latitude,
        longitude: m.location.longitude,
      })));
    }

    if (currentLocation) {
      markers.push({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    }

    if (trip.destination.coordinates?.lat !== undefined && trip.destination.coordinates?.lng !== undefined) {
      const coordinates = trip.destination.coordinates;
      markers.push({
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      });
    }

    if (mapRef.current && markers.length > 0) {
      mapRef.current.fitToCoordinates(markers, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const handleMapReady = () => {
    console.log('[MapDebug] Map ready called, coordinates:', JSON.stringify(trip.destination.coordinates));
    setMapLoaded(true);
    setIsLoading(false);
  
    if (mapRef.current && trip.destination?.coordinates) {
      InteractionManager.runAfterInteractions(() => {
        console.log('[MapDebug] Animating to region');
        mapRef.current?.animateToRegion({
          latitude: trip.destination.coordinates?.lat || DEFAULT_COORDINATES.latitude,
          longitude: trip.destination.coordinates?.lng || DEFAULT_COORDINATES.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      });
    }
  };

  const handleMapError = () => {
    console.error('[MapDebug] Map error occurred');
    setMapError('Error loading the map.');
    setMapLoadAttempts(prev => prev + 1);
  };

  const renderMap = () => (
    <MapView
      key={`map-${trip.id}-${Platform.OS}`}
      ref={mapRef}
      style={styles(theme).map}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={region}
      onMapReady={handleMapReady}
      loadingEnabled
      showsUserLocation={isLocationSharingEnabled}
      showsMyLocationButton
      showsCompass
      showsScale
      minZoomLevel={10}
      maxZoomLevel={20}
      scrollEnabled
      zoomEnabled
      rotateEnabled
      pitchEnabled
    >

      {memberLocationArray.map((m) => m.userId !== user?.id && (
        <Marker
          key={m.userId}
          coordinate={{ latitude: m.location.latitude, longitude: m.location.longitude }}
          title={m.name || `Member ${m.userId.slice(0, 4)}`}
        />
      ))}
      {currentLocation && isLocationSharingEnabled && (
        <Marker
          coordinate={{
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          }}
          title="You"
        />
      )}
      {trip.destination.coordinates && (
        <Marker
          coordinate={{
            latitude: trip.destination.coordinates?.lat || DEFAULT_COORDINATES.latitude,
            longitude: trip.destination.coordinates?.lng || DEFAULT_COORDINATES.longitude,
          }}
          title={trip.destination.address}
        />
      )}
    </MapView>
  );

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).header}>
        <Text style={styles(theme).title}>Group Location</Text>
        <Pressable onPress={onClose}>
          <Text style={styles(theme).closeButtonText}>{isStandalone ? 'Back' : 'Close'}</Text>
        </Pressable>
      </View>

      <LocationSharingToggle />

      {!isLocationSharingEnabled && (
        <Surface style={styles(theme).warningContainer} elevation={0}>
          <AlertCircle size={20} color={theme.colors.status.error.content} />
          <Text style={styles(theme).warningText}>
            Location sharing is disabled.
          </Text>
        </Surface>
      )}

      {locationError && (
        <Surface style={styles(theme).errorContainer} elevation={0}>
          <AlertCircle size={20} color={theme.colors.status.error.content} />
          <Text style={styles(theme).errorText}>{locationError}</Text>
        </Surface>
      )}

      <View style={styles(theme).mapContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary?.main || '#FF8F5E'} />
        ) : mapError && mapLoadAttempts >= 2 ? (
          <View>
            <Text>Map Unavailable</Text>
            <Pressable onPress={() => {
              setMapError(null);
              setMapLoadAttempts(0);
              setMapLoaded(false);
              setIsLoading(true);
            }}>
              <Text>Retry</Text>
            </Pressable>
          </View>
        ) : (
          renderMap()
        )}
      </View>

      <View style={styles(theme).footer}>
        <Pressable style={styles(theme).fitButton} onPress={fitToMarkers}>
          <Text style={styles(theme).fitButtonText}>Fit All Members</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.default },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  closeButtonText: { color: theme.colors.primary.main },
  mapContainer: { 
    flex: 1, 
    minHeight: 300, 
    zIndex: 1, 
    position: 'relative',
    overflow: 'hidden',
    pointerEvents: 'box-none',
  },
  map: { 
    width: '100%', 
    height: '100%',
    ...Platform.select({
      ios: {
        zIndex: 5,
      }
    })
  },
  warningContainer: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  warningText: { marginLeft: 8 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  errorText: { marginLeft: 8 },
  footer: { padding: 16 },
  fitButton: { backgroundColor: theme.colors.primary.main, padding: 12, borderRadius: 8 },
  fitButtonText: { color: '#FFF', textAlign: 'center' },
});
