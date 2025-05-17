import { create } from 'zustand';
import * as Location from 'expo-location';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { useAuthStore } from '@/src/features/auth/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/src/utils/logger';
import { MemberLocation, LocationState } from '../types';

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
        const activeTripId = 'current-trip'; // TODO: This needs a proper way to get current trip context
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
    const { locationSubscription } = get();
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
          locations = generateMockMemberLocations(34.0522, -118.2437); // Default to LA
        }
      } else {
        // Fetch actual locations from backend
        const response = await api.get<MemberLocation[]>(API_PATHS.location.members(tripId));
        locations = response.data;
      }

      // Update state with fetched/mocked locations for the specific tripId
      set(state => ({
        memberLocations: {
          ...state.memberLocations,
          [tripId]: locations.reduce((acc, loc) => {
            acc[loc.userId] = loc;
            return acc;
          }, {} as Record<string, MemberLocation>)
        }
      }));
      
      logger.debug('Successfully fetched/mocked member locations for trip:', tripId, locations);
      return locations;
      
    } catch (error) {
      logger.error('Failed to get member locations for trip:', tripId, error);
      // Set empty array for this tripId in case of error to avoid stale data
      set(state => ({
        memberLocations: {
          ...state.memberLocations,
          [tripId]: {}
        }
      }));
      return [];
    }
  },

  updateMemberLocation: (tripId: string, memberLocation: MemberLocation) => {
    logger.debug('Updating single member location for trip:', tripId, memberLocation);
    set(state => ({
      memberLocations: {
        ...state.memberLocations,
        [tripId]: {
          ...state.memberLocations[tripId],
          [memberLocation.userId]: memberLocation,
        },
      },
    }));
  },

  clearMemberLocations: (tripId: string) => {
    logger.debug('Clearing member locations for trip:', tripId);
    set(state => ({
      memberLocations: {
        ...state.memberLocations,
        [tripId]: {},
      },
    }));
  },
  
  // Initialize store from AsyncStorage
  async init() {
    try {
      const storedValue = await AsyncStorage.getItem('locationSharingEnabled');
      if (storedValue !== null) {
        const isEnabled = JSON.parse(storedValue);
        set({ isLocationSharingEnabled: isEnabled });
        logger.debug('Initialized locationSharingEnabled from storage:', isEnabled);
      }
    } catch (error) {
      logger.error('Failed to load location sharing preference from storage', error);
    }
  },
}));

// Call init function to load initial state from AsyncStorage
useLocationStore.getState().init(); 