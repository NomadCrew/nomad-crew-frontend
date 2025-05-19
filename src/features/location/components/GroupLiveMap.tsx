import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, InteractionManager, Platform, Pressable, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useLocationStore } from '../store/useLocationStore'; // Updated
import { useAuthStore } from '@/src/features/auth/store';
import { Trip } from '@/src/features/trips/types';
import { AlertCircle, Info } from 'lucide-react-native';
import { LocationSharingToggle } from './LocationSharingToggle'; // Correct after move
import { Surface } from 'react-native-paper';
import { Theme } from '@/src/theme/types';
// import { LiveLocation, UserLocation } from '@/src/types/location'; // Removed, not used and path is old

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
  const { theme } = useAppTheme();
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
  }, [trip.id, isLocationSharingEnabled, getMemberLocations, startLocationTracking]); // Added dependencies

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
      setRegion(prevRegion => ({
        ...prevRegion, // Keep delta values if already set
        latitude: trip.destination.coordinates.lat,
        longitude: trip.destination.coordinates.lng,
      }));
      console.log('[MapDebug] Initial region set from trip destination:', JSON.stringify(trip.destination.coordinates));
    }
  }, [trip.id, trip.destination.coordinates]); // Added dependencies

  const fitToMarkers = () => {
    const markers: { latitude: number; longitude: number }[] = [];

    if (memberLocationArray.length > 0) {
      markers.push(...memberLocationArray.map(m => ({
        latitude: m.location.latitude,
        longitude: m.location.longitude,
      })));
    }

    if (currentLocation && isLocationSharingEnabled) {
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
  
  // Fit to markers when map is loaded and member locations are available
  useEffect(() => {
    if (mapLoaded && (memberLocationArray.length > 0 || currentLocation)) {
      InteractionManager.runAfterInteractions(() => {
        fitToMarkers();
      });
    }
  }, [mapLoaded, memberLocationArray, currentLocation, fitToMarkers]); // Added fitToMarkers to dependencies

  const handleMapReady = () => {
    console.log('[MapDebug] Map ready called, initial region:', JSON.stringify(region));
    setMapLoaded(true);
    setIsLoading(false);
  
    // Animate to initial region based on trip destination after interactions
    if (mapRef.current && trip.destination?.coordinates?.lat && trip.destination?.coordinates?.lng) {
      InteractionManager.runAfterInteractions(() => {
        console.log('[MapDebug] Animating to initial trip destination region');
        mapRef.current?.animateToRegion({
          latitude: trip.destination.coordinates.lat,
          longitude: trip.destination.coordinates.lng,
          latitudeDelta: region.latitudeDelta, // Keep existing delta
          longitudeDelta: region.longitudeDelta, // Keep existing delta
        }, 1000);
        // Then fit to markers if needed
        fitToMarkers(); 
      });
    } else if (currentLocation && isLocationSharingEnabled) {
        InteractionManager.runAfterInteractions(() => {
            console.log('[MapDebug] Animating to current user location');
            mapRef.current?.animateToRegion({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: region.latitudeDelta,
                longitudeDelta: region.longitudeDelta,
            }, 1000);
            fitToMarkers();
        });
    }
  };

  const handleMapError = (error: any) => { // Added error param
    console.error('[MapDebug] Map error occurred:', error?.nativeEvent?.error || error);
    setMapError('Error loading the map. Please ensure Google Maps services are available and configured.');
    setMapLoadAttempts(prev => prev + 1);
    setIsLoading(false); // Ensure loading is stopped on error
  };
  
  const retryLoadMap = () => {
    console.log('[MapDebug] Retrying map load.');
    setMapError(null);
    setMapLoadAttempts(0);
    setMapLoaded(false);
    setIsLoading(true); 
    // Potentially re-trigger map setup if needed, e.g., by changing a key or re-fetching data
    // For now, relying on MapView's own retry/reload or user interaction
  };

  const renderMap = () => (
    <MapView
      key={`map-${trip.id}-${Platform.OS}-${mapLoadAttempts}`} // Add mapLoadAttempts to key to force re-render on retry
      ref={mapRef}
      style={styles(theme).map}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={region} // Use state `region` which is updated
      onMapReady={handleMapReady}
      onError={handleMapError} // Added onError handler
      loadingEnabled={isLoading} // Controlled by isLoading state
      showsUserLocation={isLocationSharingEnabled} // Show blue dot for user
      showsMyLocationButton // Default button to center on user
      showsCompass
      // showsScale // Can be too noisy
      minZoomLevel={5} // Allow zooming out more
      maxZoomLevel={20}
      scrollEnabled
      zoomEnabled
      rotateEnabled
      // pitchEnabled // Can be disorienting for users
    >

      {memberLocationArray.map((m) => m.userId !== user?.id && (
        <Marker
          key={m.userId}
          coordinate={{ latitude: m.location.latitude, longitude: m.location.longitude }}
          title={m.name || `Member ${m.userId.slice(0, 4)}`}
          // pinColor={theme.colors.primary.main} // Example: Themed marker
        />
      ))}
      {/* Current user marker is handled by showsUserLocation, no need for explicit marker if true */}
      {trip.destination.coordinates?.lat && trip.destination.coordinates?.lng && (
        <Marker
          coordinate={{
            latitude: trip.destination.coordinates.lat,
            longitude: trip.destination.coordinates.lng,
          }}
          title={trip.destination.address || 'Destination'}
          pinColor={theme.colors.accent?.main || 'blue'} // Example: Different color for destination
        />
      )}
    </MapView>
  );

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).header}>
        <Text style={styles(theme).title}>{isStandalone ? 'Live Map' : 'Group Location'}</Text>
        <Pressable onPress={onClose}>
          <Text style={styles(theme).closeButtonText}>{isStandalone ? 'Back' : 'Close'}</Text>
        </Pressable>
      </View>

      <LocationSharingToggle />

      {!isLocationSharingEnabled && (
        <Surface style={styles(theme).warningContainer} elevation={0}>
          <AlertCircle size={20} color={theme.colors.status.warning?.content || 'orange'} />
          <Text style={styles(theme).warningText}>
            Enable location sharing to see and share live locations.
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
        {isLoading && !mapLoaded && (
           <View style={styles(theme).activityIndicatorContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary?.main || '#FF8F5E'} />
            <Text style={styles(theme).loadingText}>Loading Map...</Text>
          </View>
        )}
        {mapError && (
          <View style={styles(theme).errorOverlay}>
            <AlertCircle size={24} color={theme.colors.status.error.content} />
            <Text style={styles(theme).mapErrorText}>{mapError}</Text>
            {mapLoadAttempts < 3 && Platform.OS === 'android' && (
                 <Pressable style={styles(theme).retryButton} onPress={retryLoadMap}>
                    <Text style={styles(theme).retryButtonText}>Retry</Text>
                 </Pressable>
            )}
             <Text style={styles(theme).mapErrorDetailText}>Ensure Google Play Services are up to date if on Android.</Text>
          </View>
        )}
        <View style={{flex: 1, display: isLoading || mapError ? 'none' : 'flex'}}>
         {renderMap()} 
        </View>
      </View>
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.inset.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
    backgroundColor: theme.colors.surface.default, 
  },
  title: {
    fontSize: theme.typography.size.lg,
    fontWeight: 'bold',
    color: theme.colors.content.primary,
  },
  closeButtonText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.inset.sm,
    backgroundColor: theme.colors.status.warning?.background || '#FFFBEB',
    margin: theme.spacing.inset.sm,
    borderRadius: theme.borderRadius.sm,
  },
  warningText: {
    marginLeft: theme.spacing.inset.xs,
    fontSize: theme.typography.size.sm,
    color: theme.colors.status.warning?.content || '#F59E0B',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.inset.sm,
    backgroundColor: theme.colors.status.error.background,
    margin: theme.spacing.inset.sm,
    borderRadius: theme.borderRadius.sm,
  },
  errorText: {
    marginLeft: theme.spacing.inset.xs,
    fontSize: theme.typography.size.sm,
    color: theme.colors.status.error.content,
  },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.variant, // Placeholder background for map area
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  activityIndicatorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent overlay
  },
  loadingText: {
    marginTop: theme.spacing.inset.xs,
    fontSize: theme.typography.size.sm,
    color: theme.colors.content.secondary,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    padding: theme.spacing.inset.md,
  },
  mapErrorText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.status.error.content,
    textAlign: 'center',
    marginBottom: theme.spacing.inset.sm,
  },
   mapErrorDetailText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.content.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.inset.xs,
  },
  retryButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: theme.spacing.inset.xs,
    paddingHorizontal: theme.spacing.inset.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.inset.sm,
  },
  retryButtonText: {
    color: theme.colors.primary.content,
    fontWeight: 'bold',
    fontSize: theme.typography.size.sm,
  },
}); 