import { create } from 'zustand';
import * as Location from 'expo-location';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { useAuthStore } from './useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/src/utils/logger';

export interface MemberLocation {
  userId: string;
  name?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number;
  };
}

// Mock data for testing while backend endpoints are being implemented
const MOCK_MODE = true; // Set to false when backend is ready

// Generate mock member locations around a given center point
const generateMockMemberLocations = (
  centerLat: number, 
  centerLng: number, 
  count: number = 3
): MemberLocation[] => {
  logger.debug('Generating mock member locations around', { centerLat, centerLng, count });
  
  const mockLocations = Array.from({ length: count }).map((_, index) => ({
    userId: `mock-user-${index + 1}`,
    name: `Test User ${index + 1}`,
    location: {
      latitude: centerLat + (Math.random() - 0.5) * 0.01, // Random offset within ~1km
      longitude: centerLng + (Math.random() - 0.5) * 0.01,
      accuracy: 10,
      timestamp: Date.now() - Math.floor(Math.random() * 300000) // Random time in last 5 minutes
    }
  }));
  
  logger.debug('Generated mock locations:', mockLocations);
  return mockLocations;
};

interface LocationState {
  // Settings
  isLocationSharingEnabled: boolean;
  setLocationSharingEnabled: (enabled: boolean) => Promise<void>;
  
  // Current user's location
  currentLocation: Location.LocationObject | null;
  locationError: string | null;
  isTrackingLocation: boolean;
  
  // Trip member locations
  memberLocations: Record<string, Record<string, MemberLocation>>;
  
  // Actions
  startLocationTracking: (tripId: string) => Promise<void>;
  stopLocationTracking: () => void;
  updateLocation: (location: Location.LocationObject) => Promise<void>;
  
  // Member location management
  getMemberLocations: (tripId: string) => Promise<MemberLocation[]>;
  updateMemberLocation: (tripId: string, memberLocation: MemberLocation) => void;
  clearMemberLocations: (tripId: string) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  // Settings
  isLocationSharingEnabled: false,
  
  // Current user's location
  currentLocation: null,
  locationError: null,
  isTrackingLocation: false,
  
  // Trip member locations
  memberLocations: {},
  
  // Location tracking subscription
  locationSubscription: null as Location.LocationSubscription | null,
  
  setLocationSharingEnabled: async (enabled: boolean) => {
    try {
      logger.debug('Setting location sharing enabled:', enabled);
      await AsyncStorage.setItem('locationSharingEnabled', JSON.stringify(enabled));
      set({ isLocationSharingEnabled: enabled });
      
      // If enabling, start tracking if not already tracking
      if (enabled && !get().isTrackingLocation) {
        // Find active trip ID from another store or context if needed
        // For now, just use a placeholder
        const activeTripId = 'current-trip';
        get().startLocationTracking(activeTripId);
      } else if (!enabled && get().isTrackingLocation) {
        get().stopLocationTracking();
      }
    } catch (error) {
      logger.error('Failed to save location sharing preference', error);
    }
  },
  
  startLocationTracking: async (tripId: string) => {
    // Don't start tracking if location sharing is disabled
    if (!get().isLocationSharingEnabled) {
      logger.debug('Not starting location tracking because sharing is disabled');
      return;
    }
    
    // Don't start tracking if already tracking
    if (get().isTrackingLocation) {
      logger.debug('Already tracking location, not starting again');
      return;
    }
    
    try {
      logger.debug('Starting location tracking for trip:', tripId);
      
      // Request permissions if not already granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        logger.debug('Location permission not granted:', status);
        set({ 
          locationError: 'Location permission not granted',
          isTrackingLocation: false
        });
        return;
      }
      
      // Start watching position
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10, // Update if moved by 10 meters
          timeInterval: 30000,  // Or every 30 seconds
        },
        async (location) => {
          logger.debug('Location update received:', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          
          // Update local state
          set({ currentLocation: location });
          
          // Send to server
          await get().updateLocation(location);
        }
      );
      
      set({ 
        isTrackingLocation: true,
        locationError: null,
        locationSubscription: subscription
      });
      
      logger.debug('Location tracking started successfully');
    } catch (error) {
      logger.error('Failed to start location tracking:', error);
      set({ 
        locationError: error instanceof Error ? error.message : 'Failed to start location tracking',
        isTrackingLocation: false
      });
    }
  },
  
  stopLocationTracking: () => {
    logger.debug('Stopping location tracking');
    const { locationSubscription } = get() as any;
    if (locationSubscription) {
      locationSubscription.remove();
    }
    
    set({ 
      isTrackingLocation: false,
      locationSubscription: null
    });
  },
  
  updateLocation: async (location: Location.LocationObject) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      logger.debug('No user found, not updating location');
      return;
    }
    
    try {
      // Only send location update if sharing is enabled
      if (get().isLocationSharingEnabled) {
        if (MOCK_MODE) {
          // In mock mode, just log the update but don't make the API call
          logger.debug('MOCK', 'Location update:', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp
          });
          return;
        }
        
        await api.post(API_PATHS.location.update, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp
        });
      }
    } catch (error) {
      // Log the error but don't set an error state to avoid disrupting the UI
      logger.error('Failed to update location', error);
    }
  },
  
  getMemberLocations: async (tripId: string) => {
    try {
      logger.debug('Getting member locations for trip:', tripId);
      
      // Only fetch locations if sharing is enabled
      if (!get().isLocationSharingEnabled) {
        logger.debug('Location sharing disabled, not fetching member locations');
        return [];
      }
      
      let locations: MemberLocation[] = [];
      
      if (MOCK_MODE) {
        // Use mock data in mock mode
        const currentLocation = get().currentLocation;
        if (currentLocation) {
          logger.debug('Using current location for mock data:', {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude
          });
          
          // Generate mock locations around the user's current location
          locations = generateMockMemberLocations(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude
          );
          
          // Add a slight delay to simulate network request
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          logger.debug('No current location, using default coordinates for mock data');
          // Default mock locations if no current location
          locations = generateMockMemberLocations(37.7749, -122.4194); // San Francisco
        }
      } else {
        // Real API call
        logger.debug('Making API call to get member locations');
        const response = await api.get<MemberLocation[]>(API_PATHS.location.byTrip(tripId));
        locations = response.data;
      }
      
      logger.debug('Received member locations:', locations);
      
      // Update store
      const memberLocationsMap = { ...get().memberLocations };
      memberLocationsMap[tripId] = {};
      
      locations.forEach(location => {
        memberLocationsMap[tripId][location.userId] = location;
      });
      
      set({ memberLocations: memberLocationsMap });
      return locations;
    } catch (error) {
      logger.error('Failed to get member locations', error);
      
      // In case of error, return empty array but don't disrupt the UI
      return [];
    }
  },
  
  updateMemberLocation: (tripId: string, memberLocation: MemberLocation) => {
    set(state => {
      const memberLocationsMap = { ...state.memberLocations };
      
      if (!memberLocationsMap[tripId]) {
        memberLocationsMap[tripId] = {};
      }
      
      memberLocationsMap[tripId][memberLocation.userId] = memberLocation;
      
      return { memberLocations: memberLocationsMap };
    });
  },
  
  clearMemberLocations: (tripId: string) => {
    set(state => {
      const memberLocationsMap = { ...state.memberLocations };
      delete memberLocationsMap[tripId];
      return { memberLocations: memberLocationsMap };
    });
  }
}));

// Initialize location sharing preference from storage
AsyncStorage.getItem('locationSharingEnabled')
  .then(value => {
    if (value !== null) {
      const enabled = JSON.parse(value);
      logger.debug('Loaded location sharing preference from storage:', enabled);
      useLocationStore.setState({ isLocationSharingEnabled: enabled });
    }
  })
  .catch(error => {
    logger.error('Failed to load location sharing preference', error);
  }); 