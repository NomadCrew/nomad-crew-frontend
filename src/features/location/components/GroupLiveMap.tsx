import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  InteractionManager,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useLocationStore } from '../store/useLocationStore';
import { useAuthStore } from '@/src/features/auth/store';
import { Trip } from '@/src/features/trips/types';
import { AlertCircle } from 'lucide-react-native';
import { getMemberColor, TripMember } from '../utils/memberColors';
import { LocationSharingToggle } from './LocationSharingToggle';
import { Surface } from 'react-native-paper';
import { Theme } from '@/src/theme/types';

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

export const GroupLiveMap: React.FC<GroupLiveMapProps> = ({
  trip,
  onClose,
  isStandalone = false,
}) => {
  const { theme } = useAppTheme();
  const mapRef = useRef<MapView>(null);
  const isMountedRef = useRef(true); // Track if component is mounted
  const hasCalledFitToMarkersRef = useRef(false); // Prevent duplicate fitToMarkers calls
  const { user } = useAuthStore();
  const {
    isLocationSharingEnabled,
    currentLocation,
    memberLocations,
    startLocationTracking,
    stopLocationTracking,
    getMemberLocations,
    locationError,
  } = useLocationStore();

  // Calculate initial region from trip destination
  const getInitialRegion = useCallback((): Region => {
    const lat = trip.destination?.coordinates?.lat;
    const lng = trip.destination?.coordinates?.lng;

    if (lat !== undefined && lng !== undefined) {
      return {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return DEFAULT_COORDINATES;
  }, [trip.destination?.coordinates]);

  const [region] = useState<Region>(getInitialRegion());
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

  // Convert trip members to the format needed for color assignment
  const tripMembers: TripMember[] = (trip.members || []).map((m) => ({
    userId: m.userId,
    name: m.name,
    role: m.role,
    joinedAt: m.joinedAt,
  }));

  // Set isMountedRef to false when component unmounts
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // iOS fallback: onMapReady is unreliable on iOS, so use a timeout to hide loading
  useEffect(() => {
    if (Platform.OS === 'ios' && !mapLoaded) {
      const fallbackTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          console.log('[MapDebug] iOS fallback: hiding loading overlay after timeout');
          setMapLoaded(true);
          setIsLoading(false);
        }
      }, 2000);

      return () => clearTimeout(fallbackTimeout);
    }
    return undefined;
  }, [mapLoaded]);

  // Start location tracking and fetch member locations
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

    const fetchLocations = async () => {
      if (!isMountedRef.current) return;

      try {
        setIsLoading(true);
        await getMemberLocations(trip.id);
      } catch (error) {
        if (isMountedRef.current) {
          setMapError('Unable to fetch member locations.');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchLocations();

    // IMPORTANT: Cleanup on unmount - stop location tracking to prevent memory leaks
    return () => {
      stopLocationTracking();
    };
  }, [
    trip.id,
    isLocationSharingEnabled,
    getMemberLocations,
    startLocationTracking,
    stopLocationTracking,
  ]);

  // Memoized fitToMarkers function
  const fitToMarkers = useCallback(() => {
    // Guard: Don't call if unmounted or no map ref
    if (!isMountedRef.current || !mapRef.current) {
      return;
    }

    const markers: { latitude: number; longitude: number }[] = [];

    // Add member locations
    if (memberLocationArray.length > 0) {
      markers.push(
        ...memberLocationArray.map((m) => ({
          latitude: m.location.latitude,
          longitude: m.location.longitude,
        }))
      );
    }

    // Add current user location if sharing
    if (currentLocation && isLocationSharingEnabled) {
      markers.push({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    }

    // Add trip destination
    const destLat = trip.destination?.coordinates?.lat;
    const destLng = trip.destination?.coordinates?.lng;
    if (destLat !== undefined && destLng !== undefined) {
      markers.push({
        latitude: destLat,
        longitude: destLng,
      });
    }

    // Guard: Don't call fitToCoordinates with empty markers
    if (markers.length === 0) {
      console.log('[MapDebug] fitToMarkers: No markers to fit');
      return;
    }

    console.log('[MapDebug] fitToMarkers: Fitting to', markers.length, 'markers');
    mapRef.current.fitToCoordinates(markers, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  }, [
    memberLocationArray,
    currentLocation,
    isLocationSharingEnabled,
    trip.destination?.coordinates,
  ]);

  // Fit to markers when map is loaded (ONLY ONCE - do not call in onMapReady)
  useEffect(() => {
    if (mapLoaded && !hasCalledFitToMarkersRef.current) {
      // Only fit if we have member locations or current location
      const hasLocations = memberLocationArray.length > 0 || currentLocation;
      if (hasLocations) {
        hasCalledFitToMarkersRef.current = true;
        InteractionManager.runAfterInteractions(() => {
          if (isMountedRef.current) {
            fitToMarkers();
          }
        });
      }
    }
  }, [mapLoaded, memberLocationArray.length, currentLocation, fitToMarkers]);

  const handleMapReady = useCallback(() => {
    if (!isMountedRef.current) return;

    console.log('[MapDebug] Map ready called');
    console.log('[MapDebug] Initial region:', JSON.stringify(region));
    console.log('[MapDebug] Trip destination:', JSON.stringify(trip.destination?.coordinates));

    setMapLoaded(true);
    setIsLoading(false);

    // NOTE: We do NOT call fitToMarkers here - it's handled by the useEffect above
    // Calling it here AND in useEffect causes double execution and crashes
  }, [region, trip.destination?.coordinates]);

  const handleMapError = useCallback((error: { nativeEvent?: { error?: string } }) => {
    console.error('[MapDebug] Map error occurred:', error?.nativeEvent?.error || error);
    if (isMountedRef.current) {
      setMapError(
        'Error loading the map. Please ensure Google Maps services are available and configured.'
      );
      setMapLoadAttempts((prev) => prev + 1);
      setIsLoading(false);
    }
  }, []);

  const retryLoadMap = useCallback(() => {
    console.log('[MapDebug] Retrying map load.');
    setMapError(null);
    setMapLoadAttempts(0);
    setMapLoaded(false);
    setIsLoading(true);
    hasCalledFitToMarkersRef.current = false; // Reset so fitToMarkers can be called again
  }, []);

  const renderMap = () => {
    console.log('[MapDebug] renderMap called with region:', JSON.stringify(region));

    return (
      <MapView
        key={`map-${trip.id}-${Platform.OS}-${mapLoadAttempts}`}
        ref={mapRef}
        style={styles(theme).map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        onMapReady={handleMapReady}
        onMapLoaded={() => console.log('[MapDebug] onMapLoaded fired')}
        loadingEnabled={isLoading}
        showsUserLocation={isLocationSharingEnabled}
        showsMyLocationButton
        showsCompass
        // REMOVED: minZoomLevel - causes crashes on iOS with initialRegion
        // minZoomLevel={5}
        maxZoomLevel={20}
        scrollEnabled
        zoomEnabled
        rotateEnabled
      >
        {memberLocationArray.map((m) => {
          if (m.userId === user?.id) return null;

          const memberColor = getMemberColor(tripMembers, m.userId, trip.id);
          const displayName = m.name || `Member ${m.userId.slice(0, 4)}`;

          return (
            <Marker
              key={m.userId}
              coordinate={{ latitude: m.location.latitude, longitude: m.location.longitude }}
              pinColor={memberColor}
            >
              <Callout tooltip style={styles(theme).calloutContainer}>
                <View style={[styles(theme).calloutBubble, { borderColor: memberColor }]}>
                  <View style={[styles(theme).calloutColorDot, { backgroundColor: memberColor }]} />
                  <Text style={styles(theme).calloutText}>{displayName}</Text>
                </View>
                <View style={[styles(theme).calloutArrow, { borderTopColor: memberColor }]} />
              </Callout>
            </Marker>
          );
        })}
        {trip.destination?.coordinates?.lat !== undefined &&
          trip.destination?.coordinates?.lng !== undefined && (
            <Marker
              coordinate={{
                latitude: trip.destination.coordinates.lat,
                longitude: trip.destination.coordinates.lng,
              }}
              title={trip.destination.address || 'Destination'}
              pinColor={theme.colors.primary?.main || 'blue'}
            />
          )}
      </MapView>
    );
  };

  console.log('[GroupLiveMap] Component rendering, tripId:', trip.id);
  console.log(
    '[GroupLiveMap] mapLoaded:',
    mapLoaded,
    'isLoading:',
    isLoading,
    'mapError:',
    mapError
  );

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
        {renderMap()}
        {isLoading && !mapLoaded && (
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
            <Text style={styles(theme).mapErrorDetailText}>
              Ensure Google Play Services are up to date if on Android.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
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
      position: 'relative',
      backgroundColor: theme.colors.surface.variant,
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    activityIndicatorContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
      color: theme.colors.primary?.text || '#FFFFFF',
      fontWeight: 'bold',
      fontSize: theme.typography.size.sm,
    },
    // Callout styles for member markers
    calloutContainer: {
      alignItems: 'center',
    },
    calloutBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface.default,
      paddingHorizontal: theme.spacing.inset.sm,
      paddingVertical: theme.spacing.inset.xs,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    calloutColorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: theme.spacing.inset.xs,
    },
    calloutText: {
      fontSize: theme.typography.size.sm,
      fontWeight: '600',
      color: theme.colors.content.primary,
    },
    calloutArrow: {
      width: 0,
      height: 0,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderTopWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      marginTop: -1,
    },
  });
