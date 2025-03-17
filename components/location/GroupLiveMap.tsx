import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Pressable, Text, ActivityIndicator, LayoutChangeEvent, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useLocationStore, MemberLocation } from '@/src/store/useLocationStore';
import { useAuthStore } from '@/src/store/useAuthStore';
import { Trip } from '@/src/types/trip';
import { Theme } from '@/src/theme/types';
import { MapPin, User, AlertCircle, Info } from 'lucide-react-native';
import { LocationSharingToggle } from './LocationSharingToggle';
import { Surface } from 'react-native-paper';
import { logger } from '@/src/utils/logger';

// Default coordinates to use as fallback (San Francisco)
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

  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapContainerDimensions, setMapContainerDimensions] = useState({ width: 0, height: 0 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadAttempts, setMapLoadAttempts] = useState(0);
  const [mapProvider, setMapProvider] = useState<'google' | undefined>(Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined);
  
  // Use default coordinates if trip destination coordinates are missing
  const [region, setRegion] = useState<Region>({
    latitude: trip.destination.coordinates?.lat || DEFAULT_COORDINATES.latitude,
    longitude: trip.destination.coordinates?.lng || DEFAULT_COORDINATES.longitude,
    latitudeDelta: DEFAULT_COORDINATES.latitudeDelta,
    longitudeDelta: DEFAULT_COORDINATES.longitudeDelta,
  });

  // Get all member locations for this trip
  const tripMemberLocations = memberLocations[trip.id] || {};
  
  // Convert to array for rendering
  const memberLocationArray = Object.values(tripMemberLocations);

  // Log environment info on mount
  useEffect(() => {
    console.log('===== MAP DEBUG INFO =====');
    console.log('Platform:', Platform.OS, Platform.Version);
    console.log('Map Provider:', mapProvider === PROVIDER_GOOGLE ? 'Google Maps' : 'Default');
    console.log('Trip ID:', trip.id);
    console.log('Has Destination Coords:', !!trip.destination.coordinates);
    console.log('Initial Region:', JSON.stringify(region));
    console.log('========================');
    
    if (Platform.OS === 'android') {
      console.log('===== ANDROID SPECIFIC =====');
      console.log('API Level:', Platform.Version);
      console.log('Using Google Maps Provider:', mapProvider === PROVIDER_GOOGLE);
      console.log('========================');
    }
  }, []);

  useEffect(() => {
    // Start tracking when component mounts
    console.log('Starting location tracking...');
    startLocationTracking();
    // Get initial member locations
    console.log('Getting member locations...');
    getMemberLocations();

    // Clean up when component unmounts
    return () => {
      console.log('Stopping location tracking...');
      stopLocationTracking();
    };
  }, [startLocationTracking, getMemberLocations, stopLocationTracking]);

  // Update map region when current location changes
  useEffect(() => {
    if (currentLocation && isLocationSharingEnabled) {
      console.log('Updating region based on current location:', {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude
      });
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [currentLocation, isLocationSharingEnabled]);

  // Ensure region is properly initialized when trip or location changes
  useEffect(() => {
    // If we have trip destination coordinates, use them
    if (trip.destination.coordinates) {
      console.log('Setting region to trip destination:', trip.destination.coordinates);
      setRegion({
        latitude: trip.destination.coordinates.lat,
        longitude: trip.destination.coordinates.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } 
    // Otherwise, if we have current location and location sharing is enabled, use that
    else if (currentLocation && isLocationSharingEnabled) {
      console.log('Setting region to current location:', {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude
      });
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
    // Otherwise, use default coordinates
    else {
      console.log('Setting region to default coordinates:', DEFAULT_COORDINATES);
      setRegion({
        latitude: DEFAULT_COORDINATES.latitude,
        longitude: DEFAULT_COORDINATES.longitude,
        latitudeDelta: DEFAULT_COORDINATES.latitudeDelta,
        longitudeDelta: DEFAULT_COORDINATES.longitudeDelta,
      });
    }
  }, [trip.destination.coordinates, currentLocation, isLocationSharingEnabled]);

  // Force map re-render when container dimensions change significantly
  useEffect(() => {
    if (mapContainerDimensions.width > 0 && mapContainerDimensions.height > 0) {
      console.log(`Map container dimensions changed: ${mapContainerDimensions.width}x${mapContainerDimensions.height}`);
    }
  }, [mapContainerDimensions]);

  // Fit all markers on the map
  const fitToMarkers = () => {
    if (!mapRef.current) {
      console.log('Cannot fit to markers: mapRef is null');
      return;
    }
    
    const markers = [];
    
    // Add member locations
    if (memberLocationArray.length > 0) {
      console.log(`Adding ${memberLocationArray.length} member markers`);
      markers.push(...memberLocationArray.map(member => ({
        latitude: member.location.latitude,
        longitude: member.location.longitude,
      })));
    }

    // Add current location if available
    if (currentLocation) {
      console.log('Adding current location marker');
      markers.push({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    }

    // Add trip destination if available
    if (trip.destination.coordinates) {
      console.log('Adding destination marker');
      markers.push({
        latitude: trip.destination.coordinates.lat,
        longitude: trip.destination.coordinates.lng,
      });
    }

    if (markers.length > 0) {
      try {
        console.log(`Fitting to ${markers.length} markers`);
        mapRef.current.fitToCoordinates(markers, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      } catch (error) {
        console.error('Error fitting to coordinates:', error);
      }
    } else {
      // If no markers, use default region
      console.log('No markers to fit, using default region');
      setRegion({
        latitude: DEFAULT_COORDINATES.latitude,
        longitude: DEFAULT_COORDINATES.longitude,
        latitudeDelta: DEFAULT_COORDINATES.latitudeDelta,
        longitudeDelta: DEFAULT_COORDINATES.longitudeDelta,
      });
    }
  };

  // Handle map container dimensions
  const handleMapContainerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    console.log(`Map container layout: ${width}x${height}`);
    setMapContainerDimensions({ width, height });
  };

  // Retry loading the map with a different provider if it fails
  useEffect(() => {
    if (mapLoadAttempts > 0 && mapError) {
      console.log(`Map load attempt ${mapLoadAttempts} failed with error: ${mapError}`);
      
      const timer = setTimeout(() => {
        setMapError(null);
        
        // On second attempt, try without specifying a provider
        if (mapLoadAttempts === 1 && Platform.OS === 'android') {
          console.log('First attempt failed, trying without Google Maps provider');
          setMapProvider(undefined);
        } 
        // On third attempt, try with Google Maps provider again
        else if (mapLoadAttempts === 2 && Platform.OS === 'android') {
          console.log('Second attempt failed, trying with Google Maps provider again');
          setMapProvider(PROVIDER_GOOGLE);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [mapLoadAttempts, mapError]);

  // Log when component mounts and unmounts
  useEffect(() => {
    console.log(`Component mounted for trip: ${trip.id}`);
    
    return () => {
      console.log(`Component unmounted for trip: ${trip.id}`);
    };
  }, [trip.id]);

  // Log when map is ready
  const handleMapReady = () => {
    console.log(`Map ready for trip: ${trip.id}`);
    console.log('Map is ready and should be visible now');
    setMapLoaded(true);
    setIsLoading(false);
    
    // Fit to markers after a short delay to ensure the map is fully loaded
    setTimeout(() => {
      console.log('Fitting to markers after map load');
      fitToMarkers();
    }, 500);
  };

  // Handle map errors
  const handleMapError = (error: any) => {
    console.error(`Map error occurred for trip: ${trip.id}`, error);
    console.error('Map error details:', JSON.stringify(error, null, 2));
    
    // Log more detailed error information
    if (error && typeof error === 'object') {
      console.error('Error properties:', Object.keys(error));
      
      if (error.message) {
        console.error('Error message:', error.message);
      }
      
      if (error.code) {
        console.error('Error code:', error.code);
      }
    }
    
    setMapError('There was an error loading the map. Please try again later.');
    setMapLoadAttempts(prev => prev + 1);
  };

  // Render a marker for each member
  const renderMemberMarkers = () => {
    return memberLocationArray.map((member) => {
      // Skip current user, we'll render them separately
      if (member.userId === user?.id) {
        return null;
      }

      return (
        <Marker
          key={member.userId}
          coordinate={{
            latitude: member.location.latitude,
            longitude: member.location.longitude,
          }}
          title={member.name || `Member ${member.userId.substring(0, 4)}`}
        >
          <View style={styles(theme).memberMarkerOuter}>
            <View style={styles(theme).memberMarkerInner} />
          </View>
        </Marker>
      );
    });
  };

  // Render current user's marker
  const renderCurrentUserMarker = () => {
    if (!currentLocation || !isLocationSharingEnabled) return null;

    return (
      <Marker
        coordinate={{
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        }}
        title="You"
      >
        <View style={styles(theme).currentUserMarkerOuter}>
          <View style={styles(theme).currentUserMarkerInner} />
        </View>
      </Marker>
    );
  };

  // Render trip destination marker
  const renderDestinationMarker = () => {
    if (!trip.destination.coordinates) return null;

    return (
      <Marker
        coordinate={{
          latitude: trip.destination.coordinates.lat,
          longitude: trip.destination.coordinates.lng,
        }}
        title={trip.destination.address}
      >
        <View style={styles(theme).pinContainer}>
          <View style={styles(theme).pinHead} />
          <View style={styles(theme).pinTail} />
        </View>
      </Marker>
    );
  };

  // Render fallback UI with more detailed error information
  const renderFallbackUI = () => {
    return (
      <View style={styles(theme).fallbackContainer}>
        <Text style={styles(theme).fallbackTitle}>Map Unavailable</Text>
        <Text style={styles(theme).fallbackText}>
          We're having trouble loading the map. Your location is still being shared with trip members.
        </Text>
        
        {__DEV__ && mapError && (
          <Text style={[styles(theme).fallbackText, { color: theme.colors.status.error.content }]}>
            Error: {mapError}
          </Text>
        )}
        
        <Pressable 
          style={styles(theme).retryButton} 
          onPress={() => {
            console.log('Retry button pressed, resetting map');
            setMapError(null);
            setMapLoadAttempts(0);
            setIsLoading(true);
            
            // Reset provider to default
            setMapProvider(Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined);
            
            setTimeout(() => setIsLoading(false), 1000);
          }}
        >
          <Text style={styles(theme).retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[
      styles(theme).container,
      isStandalone && styles(theme).standaloneContainer
    ]}>
      <View style={[
        styles(theme).header,
        isStandalone && styles(theme).standaloneHeader
      ]}>
        <Text style={styles(theme).title}>Group Location</Text>
        <Pressable 
          style={styles(theme).closeButton} 
          onPress={onClose}
        >
          <Text style={styles(theme).closeButtonText}>{isStandalone ? 'Back' : 'Close'}</Text>
        </Pressable>
      </View>

      <LocationSharingToggle />

      {!isLocationSharingEnabled && (
        <Surface style={styles(theme).warningContainer} elevation={0}>
          <AlertCircle size={20} color={theme.colors.status.error.content} />
          <Text style={styles(theme).warningText}>
            Location sharing is disabled. Enable it to see other members' locations and share yours.
          </Text>
        </Surface>
      )}

      {locationError && (
        <Surface style={styles(theme).errorContainer} elevation={0}>
          <AlertCircle size={20} color={theme.colors.status.error.content} />
          <Text style={styles(theme).errorText}>
            {locationError}
          </Text>
        </Surface>
      )}

      {mapError && (
        <Surface style={styles(theme).errorContainer} elevation={0}>
          <AlertCircle size={20} color={theme.colors.status.error.content} />
          <Text style={styles(theme).errorText}>
            {mapError}
          </Text>
        </Surface>
      )}

      {memberLocationArray.length === 0 && isLocationSharingEnabled && !isLoading && (
        <Surface style={styles(theme).infoContainer} elevation={0}>
          <Info size={20} color={theme.colors.primary.main} />
          <Text style={styles(theme).infoText}>
            No other members are currently sharing their location.
          </Text>
        </Surface>
      )}

      <View 
        style={[
          styles(theme).mapContainer,
          isStandalone && styles(theme).standaloneMapContainer
        ]} 
        onLayout={handleMapContainerLayout}
      >
        {/* Debug info overlay in development */}
        {__DEV__ && (
          <View style={{
            position: 'absolute', 
            top: 10, 
            left: 10, 
            zIndex: 1000, 
            backgroundColor: 'rgba(0,0,0,0.7)', 
            padding: 10, 
            borderRadius: 5
          }}>
            <Text style={{color: 'white'}}>
              Map loading: {isLoading ? 'Yes' : 'No'}{'\n'}
              Map loaded: {mapLoaded ? 'Yes' : 'No'}{'\n'}
              Map error: {mapError || 'None'}{'\n'}
              Attempts: {mapLoadAttempts}{'\n'}
              Size: {mapContainerDimensions.width}x{mapContainerDimensions.height}{'\n'}
              Provider: {mapProvider === PROVIDER_GOOGLE ? 'Google' : 'Default'}{'\n'}
              Platform: {Platform.OS} {Platform.Version}
            </Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles(theme).loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles(theme).loadingText}>Loading map...</Text>
          </View>
        ) : mapError && mapLoadAttempts >= 3 ? (
          renderFallbackUI()
        ) : (
          <MapView
            key={`map-${trip.id}-${isLocationSharingEnabled}-${mapLoadAttempts}-${mapContainerDimensions.width}-${mapContainerDimensions.height}-${mapProvider}`}
            ref={mapRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: mapContainerDimensions.width,
              height: mapContainerDimensions.height,
            }}
            provider={mapProvider}
            initialRegion={region}
            liteMode={false}
            moveOnMarkerPress={false}
            onMapReady={handleMapReady}
            showsUserLocation={isLocationSharingEnabled}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
            onError={handleMapError}
          >
            {renderMemberMarkers()}
            {renderCurrentUserMarker()}
            {renderDestinationMarker()}
          </MapView>
        )}
      </View>

      <View style={styles(theme).footer}>
        <Pressable 
          style={styles(theme).fitButton} 
          onPress={fitToMarkers}
        >
          <Text style={styles(theme).fitButtonText}>Fit All Members</Text>
        </Pressable>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  title: {
    fontSize: theme.typography.size.lg,
    fontWeight: 'bold',
    color: theme.colors.content.primary,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: theme.colors.primary.main,
    fontSize: theme.typography.size.md,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    minHeight: 300,
    borderWidth: __DEV__ ? 1 : 0,
    borderColor: __DEV__ ? 'red' : 'transparent',
    marginHorizontal: 0,
    marginVertical: 0,
    overflow: 'hidden',
    height: Dimensions.get('window').height * 0.6,
    backgroundColor: theme.colors.background.paper,
    zIndex: 1, // Ensure the container is visible in view hierarchy
  },
  map: {
    width: '100%',
    height: '100%',
    minHeight: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.content.secondary,
    fontSize: theme.typography.size.md,
  },
  memberMarkerOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  memberMarkerInner: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: theme.colors.background.default,
  },
  currentUserMarkerOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4285F4', // Different color for current user
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  currentUserMarkerInner: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: theme.colors.background.default,
  },
  pinContainer: {
    width: 30,
    height: 40,
    alignItems: 'center',
  },
  pinHead: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary.main,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  pinTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: theme.colors.primary.main,
    transform: [{ rotate: '180deg' }],
    marginTop: -5,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
  },
  fitButton: {
    backgroundColor: theme.colors.primary.main,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  fitButtonText: {
    color: theme.colors.primary.text,
    fontSize: theme.typography.size.md,
    fontWeight: 'bold',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.status.error.background + '20',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.status.error.content,
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    color: theme.colors.content.primary,
    fontSize: theme.typography.size.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.status.error.background + '20',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.status.error.content,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    color: theme.colors.content.primary,
    fontSize: theme.typography.size.sm,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.primary.surface + '20',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary.main,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    color: theme.colors.content.primary,
    fontSize: theme.typography.size.sm,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background.paper,
  },
  fallbackTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: 'bold',
    color: theme.colors.content.primary,
    marginBottom: 12,
  },
  fallbackText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.content.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary.main,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: theme.colors.primary.text,
    fontSize: theme.typography.size.md,
    fontWeight: 'bold',
  },
  standaloneContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  standaloneHeader: {
    paddingTop: 10,
    paddingBottom: 16,
  },
  standaloneMapContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
});