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
 *
 * Important: This function includes auth guards to prevent API calls
 * before authentication is fully initialized (following industry best practice
 * of checking isInitialized, user, and token before making authenticated requests).
 *
 * The tripId parameter is required because the Supabase locations table
 * requires a trip_id foreign key. Location updates must be associated with a trip.
 */
const throttledServerUpdate = throttle(
  async (location: Location.LocationObject, tripId: string) => {
    const { user, isInitialized, token } = useAuthStore.getState();

    // Guard 1: Check if auth is initialized (three-state pattern: idle → signIn | signOut)
    if (!isInitialized) {
      logger.debug('LOCATION', 'Auth not initialized yet, skipping server update');
      return;
    }

    // Guard 2: Check if user and token are available
    if (!user || !token) {
      logger.debug('LOCATION', 'No user/token available, skipping server update');
      return;
    }

    // Guard 3: Require tripId - the locations table requires trip_id as NOT NULL
    if (!tripId) {
      logger.debug('LOCATION', 'No tripId available, skipping server update');
      return;
    }

    try {
      // Use trip-specific endpoint: POST /v1/trips/{tripId}/locations
      // This ensures the location is properly associated with the trip
      await api.post(API_PATHS.location.byTrip(tripId), {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: Math.floor(location.timestamp), // Backend expects int64, not float
      });
      logger.debug('LOCATION', 'Location successfully sent to server:', {
        tripId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      logger.error('LOCATION', 'Failed to send location update to server', error);
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

      // Active trip for location tracking
      // This is stored to pass to throttled updates since locations are trip-specific
      activeTripId: null as string | null,

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
        // Auth guard: Check if auth is initialized and user has token
        const { user, isInitialized, token } = useAuthStore.getState();
        if (!isInitialized) {
          logger.debug('LOCATION', 'Auth not initialized yet, deferring location tracking');
          return;
        }
        if (!user || !token) {
          logger.debug('LOCATION', 'No user/token available, deferring location tracking');
          return;
        }

        // Don't start tracking if location sharing is disabled
        if (!get().isLocationSharingEnabled) {
          logger.debug('LOCATION', 'Not starting location tracking because sharing is disabled');
          return;
        }

        // Don't start tracking if already tracking
        if (get().isTrackingLocation) {
          logger.debug('LOCATION', 'Already tracking location, not starting again');
          return;
        }

        try {
          logger.debug('LOCATION', 'Starting location tracking for trip:', tripId);

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

          // Store the active trip ID for use in throttled updates
          set({ activeTripId: tripId });

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
              // Pass the active tripId for the trip-specific endpoint
              const currentTripId = get().activeTripId;
              if (currentTripId) {
                await get().updateLocation(location, currentTripId);
              }
            }
          );

          set({
            isTrackingLocation: true,
            locationError: null,
            locationSubscription: subscription,
          });

          logger.debug('Location tracking started successfully for trip:', tripId);
        } catch (error) {
          logger.error('Failed to start location tracking:', error);
          set({
            locationError:
              error instanceof Error ? error.message : 'Failed to start location tracking',
            isTrackingLocation: false,
            activeTripId: null,
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
          activeTripId: null, // Clear active trip when stopping
        });
      },

      updateLocation: async (location: Location.LocationObject, tripId: string) => {
        const { user } = useAuthStore.getState();
        if (!user) {
          logger.debug('No user found, not updating location');
          return;
        }

        // Only send location update if sharing is enabled
        if (get().isLocationSharingEnabled) {
          // Use throttled server update for battery optimization
          // This ensures updates are sent at most once every 10 seconds
          // Pass tripId for the trip-specific endpoint
          throttledServerUpdate(location, tripId);
        }
      },

      getMemberLocations: async (tripId: string) => {
        // Auth guard: Check if auth is initialized and user has token
        const { user, isInitialized, token } = useAuthStore.getState();
        if (!isInitialized) {
          logger.debug('LOCATION', 'Auth not initialized yet, skipping member locations fetch');
          return [];
        }
        if (!user || !token) {
          logger.debug('LOCATION', 'No user/token available, skipping member locations fetch');
          return [];
        }

        try {
          logger.debug('LOCATION', 'Getting member locations for trip:', tripId);

          // Only fetch locations if sharing is enabled
          if (!get().isLocationSharingEnabled) {
            logger.debug('LOCATION', 'Location sharing disabled, not fetching member locations');
            return [];
          }

          // Fetch actual locations from backend
          const response = await api.get<MemberLocation[]>(API_PATHS.location.byTrip(tripId));
          const locations = response.data;

          // Validate that locations is an array before processing
          if (!Array.isArray(locations)) {
            logger.warn('LOCATION', 'API returned non-array for member locations:', {
              tripId,
              responseType: typeof locations,
              response: locations,
            });
            // Set empty object for this trip to avoid stale data
            set((state) => ({
              memberLocations: {
                ...state.memberLocations,
                [tripId]: {},
              },
            }));
            return [];
          }

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
export const selectActiveTripId = (state: LocationState) => state.activeTripId;

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
  activeTripId: state.activeTripId,
});

export const selectTripLocationState = (tripId: string) => (state: LocationState) => ({
  memberLocations: Object.values(state.memberLocations[tripId] || {}),
  isTrackingLocation: state.isTrackingLocation,
  currentLocation: state.currentLocation,
});
