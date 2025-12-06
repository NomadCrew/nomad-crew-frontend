import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import * as Location from 'expo-location';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { useAuthStore } from '@/src/features/auth/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/src/utils/logger';
import { MemberLocation, LocationState } from '../types';
import { useTripStore } from '@/src/features/trips/store';

/**
 * Simple throttle implementation to limit function execution frequency.
 * Ensures the function is called at most once every `delay` milliseconds.
 */
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      // Execute immediately if enough time has passed
      lastCall = now;
      func(...args);
    } else {
      // Schedule execution for when the delay period ends
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * Throttled server update function to save battery.
 * Updates are sent to the server at most once every 10 seconds.
 */
const throttledServerUpdate = throttle(
  async (location: Location.LocationObject) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      logger.debug('No user found, not updating location on server');
      return;
    }

    try {
      await api.post(API_PATHS.location.update, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: Math.floor(location.timestamp), // Backend expects int64, not float
      });
      logger.debug('Location successfully sent to server:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      logger.error('Failed to send location update to server', error);
    }
  },
  10000 // 10 seconds minimum between server updates
);

export const useLocationStore = create<LocationState>()(
  devtools(
    (set, get) => ({
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
            // Get the active trip ID from the trip store if available
            const tripStore = useTripStore.getState();
            const activeTripId = tripStore.selectedTrip?.id;

            if (activeTripId) {
              get().startLocationTracking(activeTripId);
            } else {
              logger.warn('No active trip found for location tracking');
            }
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
              isTrackingLocation: false,
            });
            return;
          }

          // Start watching position with battery-optimized settings
          const subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 50, // Update if moved by 50 meters (battery optimized)
              timeInterval: 30000, // Or every 30 seconds
            },
            async (location) => {
              logger.debug('Location update received:', {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });

              // Update local state immediately for responsive UI
              set({ currentLocation: location });

              // Send to server with throttling for battery optimization
              await get().updateLocation(location);
            }
          );

          set({
            isTrackingLocation: true,
            locationError: null,
            locationSubscription: subscription,
          });

          logger.debug('Location tracking started successfully');
        } catch (error) {
          logger.error('Failed to start location tracking:', error);
          set({
            locationError:
              error instanceof Error ? error.message : 'Failed to start location tracking',
            isTrackingLocation: false,
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
          locationSubscription: null,
        });
      },

      updateLocation: async (location: Location.LocationObject) => {
        const { user } = useAuthStore.getState();
        if (!user) {
          logger.debug('No user found, not updating location');
          return;
        }

        // Only send location update if sharing is enabled
        if (get().isLocationSharingEnabled) {
          // Use throttled server update for battery optimization
          // This ensures updates are sent at most once every 10 seconds
          throttledServerUpdate(location);
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

          // Fetch actual locations from backend
          const response = await api.get<MemberLocation[]>(API_PATHS.location.byTrip(tripId));
          const locations = response.data;

          // Update state with fetched locations for the specific tripId
          set((state) => ({
            memberLocations: {
              ...state.memberLocations,
              [tripId]: locations.reduce(
                (acc, loc) => {
                  acc[loc.userId] = loc;
                  return acc;
                },
                {} as Record<string, MemberLocation>
              ),
            },
          }));

          logger.debug('Successfully fetched member locations for trip:', tripId, locations);
          return locations;
        } catch (error) {
          logger.error('Failed to get member locations for trip:', tripId, error);
          // Set empty array for this tripId in case of error to avoid stale data
          set((state) => ({
            memberLocations: {
              ...state.memberLocations,
              [tripId]: {},
            },
          }));
          return [];
        }
      },

      updateMemberLocation: (tripId: string, memberLocation: MemberLocation) => {
        logger.debug('Updating single member location for trip:', tripId, memberLocation);
        set((state) => ({
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
        set((state) => ({
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
    }),
    { name: 'LocationStore' }
  )
);

// Call init function to load initial state from AsyncStorage
useLocationStore.getState().init?.();

// ====================
// SELECTORS
// ====================

/**
 * Selectors for efficient component re-renders.
 * Use these to select only the specific state needed by components.
 */

// Settings selectors
export const selectIsLocationSharingEnabled = (state: LocationState) =>
  state.isLocationSharingEnabled;

// Current location selectors
export const selectCurrentLocation = (state: LocationState) => state.currentLocation;
export const selectLocationError = (state: LocationState) => state.locationError;
export const selectIsTrackingLocation = (state: LocationState) => state.isTrackingLocation;

// Member locations selectors
export const selectMemberLocationsByTrip = (tripId: string) => (state: LocationState) =>
  state.memberLocations[tripId] || {};

export const selectMemberLocationsByTripArray = (tripId: string) => (state: LocationState) => {
  const locations = state.memberLocations[tripId] || {};
  return Object.values(locations);
};

export const selectMemberLocationByUser =
  (tripId: string, userId: string) => (state: LocationState) => {
    const tripLocations = state.memberLocations[tripId] || {};
    return tripLocations[userId];
  };

export const selectMemberCount = (tripId: string) => (state: LocationState) => {
  const locations = state.memberLocations[tripId] || {};
  return Object.keys(locations).length;
};

// Action selectors (for components that only need actions)
export const selectLocationActions = (state: LocationState) => ({
  setLocationSharingEnabled: state.setLocationSharingEnabled,
  startLocationTracking: state.startLocationTracking,
  stopLocationTracking: state.stopLocationTracking,
  getMemberLocations: state.getMemberLocations,
  updateMemberLocation: state.updateMemberLocation,
  clearMemberLocations: state.clearMemberLocations,
});

// Composite selectors (for common combinations)
export const selectLocationState = (state: LocationState) => ({
  currentLocation: state.currentLocation,
  isTrackingLocation: state.isTrackingLocation,
  isLocationSharingEnabled: state.isLocationSharingEnabled,
  locationError: state.locationError,
});

export const selectTripLocationState = (tripId: string) => (state: LocationState) => ({
  memberLocations: Object.values(state.memberLocations[tripId] || {}),
  isTrackingLocation: state.isTrackingLocation,
  currentLocation: state.currentLocation,
});
