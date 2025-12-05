import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, InteractionManager, Platform, Pressable, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useLocationStore } from '../store/useLocationStore';
import { useAuthStore } from '@/src/features/auth/store';
import { Trip } from '@/src/features/trips/types';
import { AlertCircle, Info } from 'lucide-react-native';
import { LocationSharingToggle } from './LocationSharingToggle';
import { Surface } from 'react-native-paper';
import { Theme } from '@/src/theme/types';
import { logger } from '@/src/utils/logger';

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
  supabaseLocations: {
    locations: any[];
    isLoading: boolean;
    error: string | null;
    connectionStatus: string;
  };
}

// DEV-only debug helper – prints consistent prefixed logs
const dbg = (label: string, payload?: any) => {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[MapDebug] ${label}`, payload ?? '');
  }
};

export const GroupLiveMap: React.FC<GroupLiveMapProps> = ({ 
  trip, 
  onClose, 
  isStandalone = false,
  supabaseLocations 
}) => {
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

  // Add timeout for loading state
  useEffect(() => {
    if (isLoading && !mapLoaded) {
      const timeout = setTimeout(() => {
        if (!mapLoaded && isLoading) {
          console.log('[MapDebug] Loading timeout reached, forcing map ready state');
          setIsLoading(false);
          setMapLoaded(true);
        }
      }, 8000); // Reduced from 10s to 8s for better UX
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading, mapLoaded]);

  // Use Supabase Realtime location data with defensive check - memoized
  const memberLocationArray = useMemo(() => {
    return supabaseLocations.locations || [];
  }, [supabaseLocations.locations]);

  useEffect(() => {
    logger.info('GroupLiveMap', `Using Supabase Realtime for location data for trip ${trip.id}`);
    console.log('[MapDebug] Component mounted - initial state:', {
      isLoading,
      mapLoaded,
      mapError,
      tripDestination: trip.destination.coordinates,
      isLocationSharingEnabled,
      Platform: Platform.OS
    });
    
    // Start location tracking for current user
    if (isLocationSharingEnabled) {
      console.log('[MapDebug] Location sharing enabled, starting tracking');
      startLocationTracking(trip.id);
    } else {
      console.log('[MapDebug] Location sharing disabled');
    }
    
    return () => {
      console.log('[MapDebug] Component unmounting');
    };
  }, [trip.id, isLocationSharingEnabled, startLocationTracking]);

  useEffect(() => {
    if (currentLocation && isLocationSharingEnabled) {
      setRegion(prevRegion => ({
        ...prevRegion,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      }));
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
  }, [trip.id, trip.destination.coordinates]);

  // Memoized fitToMarkers function
  const fitToMarkers = useCallback(() => {
    const markers: { latitude: number; longitude: number }[] = [];

    if (Array.isArray(memberLocationArray) && memberLocationArray.length > 0) {
      // Use Supabase location format
      markers.push(...memberLocationArray.map((location: any) => ({
        latitude: location.latitude,
        longitude: location.longitude,
      })));
    }

    if (currentLocation && isLocationSharingEnabled) {
      markers.push({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    }

    if (trip.destination?.coordinates?.lat !== undefined && trip.destination?.coordinates?.lng !== undefined) {
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
  }, [memberLocationArray, currentLocation, isLocationSharingEnabled, trip.destination?.coordinates]);
  
  // Fit to markers when map is loaded and member locations are available
  useEffect(() => {
    if (mapLoaded && (Array.isArray(memberLocationArray) && memberLocationArray.length > 0 || currentLocation)) {
      InteractionManager.runAfterInteractions(() => {
        fitToMarkers();
      });
    }
  }, [mapLoaded, memberLocationArray, currentLocation, fitToMarkers]);

  // Stable map ready handler - doesn't depend on changing state
  const handleMapReady = useCallback(() => {
    dbg('onMapReady → setIsLoading(false) & setMapLoaded(true)');
    // Simple state update without dependencies
    setIsLoading(false);
    setMapLoaded(true);
  }, []);

  // Fired when the native SDK has rendered the first tiles
  const handleMapLoaded = useCallback(() => {
    dbg('onMapLoaded – first tiles are visible');
  }, []);

  // Memoized error handler
  const handleMapError = useCallback((error: any) => {
    const errorDetails = error?.nativeEvent?.error || error?.message || error || 'Unknown map error';
    console.error('[MapDebug] Map error occurred:', errorDetails);
    logger.error('GroupLiveMap', 'Map error:', errorDetails);
    
    // Set appropriate error message based on error type
    let errorMessage = 'Error loading the map.';
    if (typeof errorDetails === 'string') {
      if (errorDetails.includes('Google Play Services')) {
        errorMessage = 'Google Play Services update required. Please update Google Play Services and restart the app.';
      } else if (errorDetails.includes('API key')) {
        errorMessage = 'Google Maps API configuration issue. Please contact support.';
      } else if (errorDetails.includes('network')) {
        errorMessage = 'Network error loading map. Please check your internet connection.';
      } else {
        errorMessage = `Map error: ${errorDetails}`;
      }
    }
    
    setMapError(errorMessage);
    setMapLoadAttempts(prev => prev + 1);
    setIsLoading(false);
    setMapLoaded(false);
  }, []);
  
  // Memoized retry function
  const retryLoadMap = useCallback(() => {
    console.log('[MapDebug] Retrying map load, attempt:', mapLoadAttempts + 1);
    setMapError(null);
    setMapLoaded(false);
    setIsLoading(true);
    
    // Force re-render with new key by incrementing attempts
    setMapLoadAttempts(prev => prev + 1);
  }, [mapLoadAttempts]);

  // Memoized markers array to prevent unnecessary re-renders
  const markers = useMemo(() => {
    const markerElements: React.ReactElement[] = [];

    // Member location markers
    if (Array.isArray(memberLocationArray) && memberLocationArray.length > 0) {
      memberLocationArray.forEach((location: any, index: number) => {
        const userId = location.user_id;
        const lat = location.latitude;
        const lng = location.longitude;
        const userName = location.user_name;
        
        // Don't show current user's marker (they see the blue dot)
        if (userId === user?.id) return;
        
        markerElements.push(
          <Marker
            key={`${userId}-${index}`}
            coordinate={{
              latitude: lat,
              longitude: lng,
            }}
            title={userName || 'Trip Member'}
            description={`Last updated: ${new Date().toLocaleTimeString()}`}
          />
        );
      });
    }

    // Trip destination marker
    if (trip.destination.coordinates?.lat && trip.destination.coordinates?.lng) {
      markerElements.push(
        <Marker
          key="destination"
          coordinate={{
            latitude: trip.destination.coordinates.lat,
            longitude: trip.destination.coordinates.lng,
          }}
          title={trip.destination.address || 'Trip Destination'}
          description="Trip Destination"
          pinColor="red"
        />
      );
    }

    return markerElements;
  }, [memberLocationArray, user?.id, trip.destination.coordinates, trip.destination.address]);

  // Add comprehensive state change logging
  useEffect(() => {
    console.log('[MapDebug] State changed:', {
      isLoading,
      mapLoaded,
      mapError: !!mapError,
      mapLoadAttempts,
      locationSharingEnabled: isLocationSharingEnabled,
      memberLocationsCount: memberLocationArray?.length || 0,
      hasCurrentLocation: !!currentLocation,
      tripId: trip.id
    });
  }, [isLoading, mapLoaded, mapError, mapLoadAttempts, isLocationSharingEnabled, memberLocationArray, currentLocation, trip.id]);

  // Log render-time flags so we can see when overlay should hide
  useEffect(() => {
    dbg('render flags', {
      isLoading,
      mapLoaded,
      overlay: isLoading && !mapLoaded,
    });
  }, [isLoading, mapLoaded]);

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).header}>
        <Text style={styles(theme).title}>{isStandalone ? 'Live Map' : 'Group Location'}</Text>
        <Pressable onPress={onClose}>
          <Text style={styles(theme).closeButtonText}>{isStandalone ? 'Back' : 'Close'}</Text>
        </Pressable>
      </View>

      <LocationSharingToggle tripId={trip.id} />

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
        {/* Always render the map - critical for Android */}
        <MapView
          key={`map-${trip.id}-${mapLoadAttempts}`}
          ref={mapRef}
          style={styles(theme).map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={{
            latitude: trip.destination.coordinates?.lat || DEFAULT_COORDINATES.latitude,
            longitude: trip.destination.coordinates?.lng || DEFAULT_COORDINATES.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onMapReady={handleMapReady}
          onMapLoaded={handleMapLoaded}
          loadingEnabled={false}
          showsUserLocation={isLocationSharingEnabled}
          showsMyLocationButton={Platform.OS === 'android'}
          showsCompass={true}
          showsBuildings={false}
          showsIndoors={false}
          showsPointsOfInterest={false}
          showsScale={false}
          showsTraffic={false}
          minZoomLevel={3}
          maxZoomLevel={20}
          scrollEnabled={true}
          zoomEnabled={true}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          moveOnMarkerPress={false}
          cacheEnabled={Platform.OS === 'android'}
          // Android-specific optimizations
          {...(Platform.OS === 'android' && {
            googleMapId: undefined,
            animationEnabled: true,
            compassOffset: { x: -10, y: 10 },
            mapPadding: { top: 0, right: 0, bottom: 0, left: 0 }
          })}
        >
          {markers}
        </MapView>
        
        {/* Loading overlay - only show when truly loading */}
        {(isLoading && !mapLoaded) && (
          <View style={styles(theme).activityIndicatorContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary?.main || '#FF8F5E'} />
            <Text style={styles(theme).loadingText}>Loading Map...</Text>
          </View>
        )}
        
        {/* Debug overlay to show current state */}
        {__DEV__ && (
          <View style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 8,
            borderRadius: 4,
            zIndex: 2000,
          }}>
            <Text style={{ color: 'white', fontSize: 10 }}>
              Loading: {isLoading.toString()}{'\n'}
              MapLoaded: {mapLoaded.toString()}{'\n'}
              ShowOverlay: {(isLoading && !mapLoaded).toString()}
            </Text>
          </View>
        )}
        
        {/* Error overlay */}
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
    backgroundColor: theme.colors.surface.variant,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  activityIndicatorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – palette typing lacks 'content'
    color: (theme.colors.primary as any)?.content || '#FFFFFF',
    fontWeight: 'bold',
    fontSize: theme.typography.size.sm,
  },
}); 