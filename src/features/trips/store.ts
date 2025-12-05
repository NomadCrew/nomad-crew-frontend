import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '../../api/api-client';
import {
  Trip,
  CreateTripInput,
  UpdateTripInput,
  TripStatus,
  UpdateTripStatusRequest,
  UpdateTripStatusResponse,
  WeatherForecast,
} from './types';
import { API_PATHS } from '@/src/utils/api-paths';
import { ServerEvent } from '@/src/types/events';
import { useTodoStore } from '@/src/features/todos/store';
import { mapWeatherCode } from '@/src/utils/weather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/src/features/auth/store';
import { logger } from '@/src/utils/logger';
import { getUserDisplayName } from '../auth/utils';
import { normalizeTrip } from './adapters/normalizeTrip';

interface TripState {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  selectedTrip: Trip | null;
  // Core operations
  createTrip: (input: CreateTripInput) => Promise<Trip>;
  updateTrip: (id: string, input: UpdateTripInput) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;
  // Read operations
  fetchTrips: () => Promise<void>;
  getTripById: (id: string) => Trip | undefined;
  setSelectedTrip: (trip: Trip | null) => void;
  // Member operations
  inviteMember: (
    tripId: string,
    email: string,
    role: 'owner' | 'admin' | 'member'
  ) => Promise<void>;
  revokeInvitation: (tripId: string, invitationId: string) => Promise<void>;
  updateMemberRole: (
    tripId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member'
  ) => Promise<void>;
  removeMember: (tripId: string, userId: string) => Promise<void>;
  // Status operations
  updateTripStatus: (id: string, status: TripStatus) => Promise<void>;
  // WebSocket operations
  handleTripEvent: (event: ServerEvent) => void;
  acceptInvitation: (token: string) => Promise<void>;
  checkPendingInvitations: () => Promise<void>;
  persistInvitation: (token: string) => Promise<void>;
}

export const useTripStore = create<TripState>()(
  devtools(
    (set, get) => ({
      trips: [],
      loading: false,
      error: null,
      selectedTrip: null,

      setSelectedTrip: (trip: Trip | null) => {
        set({ selectedTrip: trip });
      },

      createTrip: async (tripData: CreateTripInput) => {
        set({ loading: true, error: null });
        try {
          const currentUser = useAuthStore.getState().user;
          if (!currentUser) {
            throw new Error('User must be logged in to create a trip');
          }
          // Transform payload to match backend expectations
          const payload = {
            name: tripData.name,
            description: tripData.description,
            destinationPlaceId: tripData.destination.placeId,
            destinationAddress: tripData.destination.address,
            destinationName: tripData.destination.address, // fallback if no name field
            destinationLatitude: tripData.destination.coordinates?.lat,
            destinationLongitude: tripData.destination.coordinates?.lng,
            startDate:
              tripData.startDate instanceof Date
                ? tripData.startDate.toISOString()
                : tripData.startDate,
            endDate:
              tripData.endDate instanceof Date ? tripData.endDate.toISOString() : tripData.endDate,
          };
          const response = await api.post<Trip>(API_PATHS.trips.create, payload);
          const normalizedTrip = normalizeTrip(response.data);
          set((state) => ({
            trips: [...state.trips, normalizedTrip],
            loading: false,
          }));
          return normalizedTrip;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create trip';
          logger.error('TRIP', errorMessage);
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      updateTrip: async (id, input) => {
        set({ loading: true, error: null });
        try {
          const response = await api.put<Trip>(`${API_PATHS.trips.byId(id)}`, input);
          const normalizedTrip = normalizeTrip(response.data);
          set((state) => ({
            trips: state.trips.map((trip) => (trip.id === id ? normalizedTrip : trip)),
            loading: false,
          }));
          return normalizedTrip;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update trip';
          set({ error: message, loading: false });
          throw error;
        }
      },

      fetchTrips: async () => {
        set({ loading: true, error: null });
        logger.info('TRIP', 'fetchTrips started.');
        try {
          const response = await api.get<Trip[]>(API_PATHS.trips.list);
          logger.info('TRIP', 'Raw API response:', response.data);
          const trips = response.data.map(normalizeTrip);
          logger.info('TRIP', 'Normalized trips:', trips);
          set({
            trips: trips || ([] as Trip[]),
            loading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch trips';
          logger.error('TRIP', 'fetchTrips error:', message, error);
          set({ error: message, loading: false });
          throw error;
        }
      },

      deleteTrip: async (id) => {
        set({ loading: true, error: null });
        try {
          await api.delete(`${API_PATHS.trips.byId(id)}`);
          set((state) => ({
            trips: state.trips.filter((trip) => trip.id !== id),
            loading: false,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete trip';
          set({ error: message, loading: false });
          throw error;
        }
      },

      getTripById: (id) => {
        const trip = get().trips.find((t) => t.id === id);
        return trip;
      },

      updateTripStatus: async (id: string, status: TripStatus) => {
        set({ loading: true, error: null });
        try {
          const requestBody: UpdateTripStatusRequest = { status };
          await api.patch<UpdateTripStatusResponse>(API_PATHS.trips.updateStatus(id), requestBody);
          set((state) => ({
            trips: state.trips.map((trip) => (trip.id === id ? { ...trip, status } : trip)),
            loading: false,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update trip status';
          set({ error: message, loading: false });
          throw error;
        }
      },

      inviteMember: async (tripId: string, email: string, role: 'owner' | 'admin' | 'member') => {
        set({ loading: true, error: null });
        try {
          await api.post(API_PATHS.trips.invite(tripId), { email, role });
          // Optionally, refetch trip data or update locally if the API returns the updated trip
          // For now, we assume a WebSocket event will update the trip details with new invitation
          set({ loading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to invite member';
          logger.error('TRIP', { tripId, email, role, error: message });
          set({ error: message, loading: false });
          throw error;
        }
      },

      revokeInvitation: async (tripId: string, invitationId: string) => {
        set({ loading: true, error: null });
        try {
          // TODO: Add revoke invitation endpoint to API_PATHS.trips if available
          // await api.delete(API_PATHS.trips.revokeInvitation(tripId, invitationId));
          // For now, just set loading to false
          set({ loading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to revoke invitation';
          set({ error: message, loading: false });
          throw error;
        }
      },

      updateMemberRole: async (
        tripId: string,
        userId: string,
        role: 'owner' | 'admin' | 'member'
      ) => {
        set({ loading: true, error: null });
        try {
          // TODO: Add update member role endpoint to API_PATHS.trips if available
          // await api.patch(API_PATHS.trips.updateMemberRole(tripId, userId), { role });
          set({ loading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update member role';
          set({ error: message, loading: false });
          throw error;
        }
      },

      removeMember: async (tripId: string, userId: string) => {
        set({ loading: true, error: null });
        try {
          // TODO: Add remove member endpoint to API_PATHS.trips if available
          // await api.delete(API_PATHS.trips.removeMember(tripId, userId));
          set({ loading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to remove member';
          set({ error: message, loading: false });
          throw error;
        }
      },

      acceptInvitation: async (token: string) => {
        set({ loading: true, error: null });
        try {
          await api.post(API_PATHS.trips.acceptInvitation, { token });
          // Remove the persisted token after successful acceptance
          await AsyncStorage.removeItem(`pendingInvitation_${token}`);
          set({ loading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to accept invitation';
          logger.error('TRIP', message);
          set({ error: message, loading: false });
          throw error;
        }
      },

      persistInvitation: async (token: string) => {
        set({ loading: true, error: null });
        try {
          await AsyncStorage.setItem(`pendingInvitation_${token}`, token);
          logger.info('Persisted invitation token:', token);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to persist invitation token';
          logger.error('TRIP', message);
          set({ error: message, loading: false });
          throw error;
        }
      },

      checkPendingInvitations: async () => {
        logger.info('TRIP', 'Checking for pending invitations...');
        try {
          const keys = await AsyncStorage.getAllKeys();
          const invitationKeys = keys.filter((key) => key.startsWith('pendingInvitation_'));
          if (invitationKeys.length > 0) {
            logger.info('TRIP', `Found ${invitationKeys.length} pending invitation(s).`);
            for (const key of invitationKeys) {
              const token = await AsyncStorage.getItem(key);
              if (token) {
                try {
                  logger.info(
                    'TRIP',
                    `Attempting to accept pending invitation with token: ${token}`
                  );
                  await get().acceptInvitation(token);
                  logger.info('TRIP', `Successfully accepted invitation with token: ${token}`);
                } catch (error) {
                  logger.error(
                    'TRIP',
                    `Failed to automatically accept pending invitation: ${token}`,
                    error
                  );
                }
              }
            }
          } else {
            logger.info('TRIP', 'No pending invitations found.');
          }
        } catch (error) {
          logger.error('TRIP', 'Error checking pending invitations:', error);
        }
      },

      handleTripEvent: (event: ServerEvent) => {
        // TODO: Add type guards for event.payload if needed
        // Example: if (isTripEvent(event)) { ... }
        // For now, skip ambiguous event handling logic
      },
    }),
    { name: 'TripStore' }
  )
);

// ====================
// SELECTORS
// ====================

/**
 * Selectors for efficient component re-renders.
 * Use these to select only the specific state needed by components.
 */

// Basic state selectors
export const selectTrips = (state: TripState) => state.trips;
export const selectLoading = (state: TripState) => state.loading;
export const selectError = (state: TripState) => state.error;
export const selectSelectedTrip = (state: TripState) => state.selectedTrip;

// Derived selectors
export const selectTripById = (id: string) => (state: TripState) =>
  state.trips.find((t) => t.id === id);

export const selectTripsByStatus = (status: TripStatus) => (state: TripState) =>
  state.trips.filter((t) => t.status === status);

export const selectActiveTripCount = (state: TripState) =>
  state.trips.filter((t) => t.status === 'ACTIVE').length;

export const selectUpcomingTrips = (state: TripState) =>
  state.trips.filter((t) => {
    const startDate = new Date(t.startDate);
    return startDate > new Date() && t.status !== 'CANCELLED';
  });

export const selectPastTrips = (state: TripState) =>
  state.trips.filter((t) => {
    const endDate = new Date(t.endDate);
    return endDate < new Date();
  });

// Action selectors (for components that only need actions)
export const selectTripActions = (state: TripState) => ({
  createTrip: state.createTrip,
  updateTrip: state.updateTrip,
  deleteTrip: state.deleteTrip,
  fetchTrips: state.fetchTrips,
  setSelectedTrip: state.setSelectedTrip,
  updateTripStatus: state.updateTripStatus,
  inviteMember: state.inviteMember,
  acceptInvitation: state.acceptInvitation,
});

// Composite selectors (for common combinations)
export const selectTripsWithLoading = (state: TripState) => ({
  trips: state.trips,
  loading: state.loading,
  error: state.error,
});

// Import getUserDisplayName from auth utilsimport { getUserDisplayName } from '../auth/utils';
