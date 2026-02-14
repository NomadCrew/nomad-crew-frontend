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
import { tripApi } from './api';
import { API_PATHS } from '@/src/utils/api-paths';
import { registerStoreReset } from '@/src/utils/store-reset';
import { ServerEvent, isTripEvent, isWeatherEvent, isMemberEvent } from '@/src/types/events';
import { mapWeatherCode } from '@/src/utils/weather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/src/features/auth/store';
import { logger } from '@/src/utils/logger';
import { getUserDisplayName } from '../auth/utils';
import { normalizeTrip } from './adapters/normalizeTrip';

interface TripState {
  trips: Trip[];
  isCreating: boolean;
  isFetching: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
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
  // Event handling
  handleTripEvent: (event: ServerEvent) => void;
  acceptInvitation: (token: string) => Promise<void>;
  declineInvitation: (token: string) => Promise<void>;
  checkPendingInvitations: () => Promise<void>;
  persistInvitation: (token: string) => Promise<void>;
  // Reset
  reset: () => void;
}

export const useTripStore = create<TripState>()(
  devtools(
    (set, get) => ({
      trips: [],
      isCreating: false,
      isFetching: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      selectedTrip: null,

      setSelectedTrip: (trip: Trip | null) => {
        set({ selectedTrip: trip });
      },

      createTrip: async (tripData: CreateTripInput) => {
        set({ isCreating: true, error: null });
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
            isCreating: false,
          }));
          return normalizedTrip;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create trip';
          logger.error('TRIP', errorMessage);
          set({ error: errorMessage, isCreating: false });
          throw error;
        }
      },

      updateTrip: async (id, input) => {
        set({ isUpdating: true, error: null });
        try {
          const response = await api.put<Trip>(`${API_PATHS.trips.byId(id)}`, input);
          const normalizedTrip = normalizeTrip(response.data);
          set((state) => ({
            trips: state.trips.map((trip) => (trip.id === id ? normalizedTrip : trip)),
            isUpdating: false,
          }));
          return normalizedTrip;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update trip';
          set({ error: message, isUpdating: false });
          throw error;
        }
      },

      fetchTrips: async () => {
        set({ isFetching: true, error: null });
        logger.info('TRIP', 'fetchTrips started.');
        try {
          const response = await api.get<Trip[]>(API_PATHS.trips.list);
          logger.info('TRIP', 'Raw API response:', response.data);
          const trips = response.data.map(normalizeTrip);
          logger.info('TRIP', 'Normalized trips:', trips);
          set({
            trips: trips || ([] as Trip[]),
            isFetching: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch trips';
          logger.error('TRIP', 'fetchTrips error:', message, error);
          set({ error: message, isFetching: false });
          throw error;
        }
      },

      deleteTrip: async (id) => {
        set({ isDeleting: true, error: null });
        try {
          await api.delete(`${API_PATHS.trips.byId(id)}`);
          set((state) => ({
            trips: state.trips.filter((trip) => trip.id !== id),
            isDeleting: false,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete trip';
          set({ error: message, isDeleting: false });
          throw error;
        }
      },

      getTripById: (id) => {
        const trip = get().trips.find((t) => t.id === id);
        return trip;
      },

      updateTripStatus: async (id: string, status: TripStatus) => {
        set({ isUpdating: true, error: null });
        try {
          const requestBody: UpdateTripStatusRequest = { status };
          await api.patch<UpdateTripStatusResponse>(API_PATHS.trips.updateStatus(id), requestBody);
          set((state) => ({
            trips: state.trips.map((trip) => (trip.id === id ? { ...trip, status } : trip)),
            isUpdating: false,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update trip status';
          set({ error: message, isUpdating: false });
          throw error;
        }
      },

      inviteMember: async (tripId: string, email: string, role: 'owner' | 'admin' | 'member') => {
        set({ isUpdating: true, error: null });
        try {
          await api.post(API_PATHS.trips.invite(tripId), { email, role });
          // Optionally, refetch trip data or update locally if the API returns the updated trip
          // For now, we assume a WebSocket event will update the trip details with new invitation
          set({ isUpdating: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to invite member';
          logger.error('TRIP', { tripId, email, role, error: message });
          set({ error: message, isUpdating: false });
          throw error;
        }
      },

      revokeInvitation: async (tripId: string, invitationId: string) => {
        set({ isUpdating: true, error: null });
        try {
          // TODO: Add revoke invitation endpoint to API_PATHS.trips if available
          // await api.delete(API_PATHS.trips.revokeInvitation(tripId, invitationId));
          // For now, just set loading to false
          set({ isUpdating: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to revoke invitation';
          set({ error: message, isUpdating: false });
          throw error;
        }
      },

      updateMemberRole: async (
        tripId: string,
        userId: string,
        role: 'owner' | 'admin' | 'member'
      ) => {
        set({ isUpdating: true, error: null });
        try {
          await tripApi.updateMemberRole(tripId, userId, role);
          // Optimistically update local state
          set((state) => ({
            trips: state.trips.map((trip) => {
              if (trip.id !== tripId) return trip;
              return {
                ...trip,
                members: (trip.members || []).map((m) =>
                  m.userId === userId ? { ...m, role } : m
                ),
              };
            }),
            isUpdating: false,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update member role';
          set({ error: message, isUpdating: false });
          throw error;
        }
      },

      removeMember: async (tripId: string, userId: string) => {
        set({ isDeleting: true, error: null });
        try {
          await tripApi.removeMember(tripId, userId);
          // Optimistically update local state
          set((state) => ({
            trips: state.trips.map((trip) => {
              if (trip.id !== tripId) return trip;
              return {
                ...trip,
                members: (trip.members || []).filter((m) => m.userId !== userId),
              };
            }),
            isDeleting: false,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to remove member';
          set({ error: message, isDeleting: false });
          throw error;
        }
      },

      acceptInvitation: async (token: string) => {
        set({ isUpdating: true, error: null });
        try {
          await api.post(API_PATHS.trips.acceptInvitation, { token });
          // Remove the persisted token after successful acceptance
          await AsyncStorage.removeItem(`pendingInvitation_${token}`);
          set({ isUpdating: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to accept invitation';
          logger.error('TRIP', message);
          set({ error: message, isUpdating: false });
          throw error;
        }
      },

      declineInvitation: async (token: string) => {
        set({ isUpdating: true, error: null });
        try {
          await api.post(API_PATHS.trips.declineInvitation, { token });
          // Remove the persisted token after declining
          await AsyncStorage.removeItem(`pendingInvitation_${token}`);
          set({ isUpdating: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to decline invitation';
          logger.error('TRIP', message);
          set({ error: message, isUpdating: false });
          throw error;
        }
      },

      persistInvitation: async (token: string) => {
        set({ isUpdating: true, error: null });
        try {
          await AsyncStorage.setItem(`pendingInvitation_${token}`, token);
          logger.info('Persisted invitation token:', token);
          set({ isUpdating: false });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to persist invitation token';
          logger.error('TRIP', message);
          set({ error: message, isUpdating: false });
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
        try {
          const { type, tripId } = event;

          switch (type) {
            case 'TRIP_UPDATED': {
              if (isTripEvent(event)) {
                const payload = event.payload;
                set((state) => ({
                  trips: state.trips.map((trip) =>
                    trip.id === payload.id
                      ? {
                          ...trip,
                          name: payload.name,
                          status: payload.status as TripStatus,
                          ...(payload.startDate && { startDate: payload.startDate }),
                          ...(payload.endDate && { endDate: payload.endDate }),
                          ...(payload.description !== undefined && {
                            description: payload.description,
                          }),
                        }
                      : trip
                  ),
                }));
              }
              break;
            }

            case 'TRIP_DELETED': {
              set((state) => ({
                trips: state.trips.filter((trip) => trip.id !== tripId),
                // Clear selectedTrip if it was the deleted one
                selectedTrip: state.selectedTrip?.id === tripId ? null : state.selectedTrip,
              }));
              break;
            }

            case 'TRIP_CREATED': {
              const payload = event.payload as Record<string, unknown>;
              const newTrip = normalizeTrip(payload);
              set((state) => {
                // Avoid duplicates
                const exists = state.trips.some((t) => t.id === newTrip.id);
                if (exists) return state;
                return { trips: [...state.trips, newTrip] };
              });
              break;
            }

            case 'TRIP_STARTED':
            case 'TRIP_ENDED':
            case 'TRIP_STATUS_UPDATED': {
              const statusPayload = event.payload as { status?: string };
              const newStatus =
                type === 'TRIP_STARTED'
                  ? 'ACTIVE'
                  : type === 'TRIP_ENDED'
                    ? 'COMPLETED'
                    : (statusPayload?.status as TripStatus | undefined);

              if (newStatus) {
                set((state) => ({
                  trips: state.trips.map((trip) =>
                    trip.id === tripId ? { ...trip, status: newStatus as TripStatus } : trip
                  ),
                }));
              }
              break;
            }

            case 'WEATHER_UPDATED': {
              if (isWeatherEvent(event)) {
                const { payload } = event;
                const condition = mapWeatherCode(payload.weather_code);
                const forecast: WeatherForecast[] = payload.hourly_forecast.map((entry) => ({
                  time: entry.timestamp,
                  temperature: entry.temperature_2m,
                  precipitation: entry.precipitation,
                }));

                set((state) => ({
                  trips: state.trips.map((trip) =>
                    trip.id === payload.tripId
                      ? {
                          ...trip,
                          weatherTemp: `${Math.round(payload.temperature_2m)}`,
                          weatherCondition: condition,
                          weatherForecast: forecast,
                        }
                      : trip
                  ),
                }));
              }
              break;
            }

            case 'MEMBER_ADDED': {
              if (isMemberEvent(event)) {
                const { payload } = event;
                set((state) => ({
                  trips: state.trips.map((trip) => {
                    if (trip.id !== tripId) return trip;
                    const members = trip.members || [];
                    // Avoid duplicate members
                    if (payload.userId && members.some((m) => m.userId === payload.userId)) {
                      return trip;
                    }
                    return {
                      ...trip,
                      members: [
                        ...members,
                        {
                          userId: payload.userId || '',
                          role: (payload.role as 'owner' | 'admin' | 'member') || 'member',
                          joinedAt: new Date().toISOString(),
                        },
                      ],
                    };
                  }),
                }));
              }
              break;
            }

            case 'MEMBER_REMOVED': {
              if (isMemberEvent(event)) {
                const { payload } = event;
                set((state) => ({
                  trips: state.trips.map((trip) => {
                    if (trip.id !== tripId) return trip;
                    return {
                      ...trip,
                      members: (trip.members || []).filter((m) => m.userId !== payload.userId),
                    };
                  }),
                }));
              }
              break;
            }

            case 'MEMBER_ROLE_UPDATED': {
              if (isMemberEvent(event)) {
                const { payload } = event;
                set((state) => ({
                  trips: state.trips.map((trip) => {
                    if (trip.id !== tripId) return trip;
                    return {
                      ...trip,
                      members: (trip.members || []).map((m) =>
                        m.userId === payload.userId
                          ? {
                              ...m,
                              role: (payload.role as 'owner' | 'admin' | 'member') || m.role,
                            }
                          : m
                      ),
                    };
                  }),
                }));
              }
              break;
            }

            default:
              // Unhandled event type - no action needed
              break;
          }
        } catch (error) {
          logger.error(
            'TRIP',
            'Error handling trip event:',
            error instanceof Error ? error.message : error,
            event.type
          );
        }
      },

      reset: () => {
        set({
          trips: [],
          isCreating: false,
          isFetching: false,
          isUpdating: false,
          isDeleting: false,
          error: null,
          selectedTrip: null,
        });
      },
    }),
    { name: 'TripStore' }
  )
);

registerStoreReset('TripStore', () => useTripStore.getState().reset());

// ====================
// SELECTORS
// ====================

/**
 * Selectors for efficient component re-renders.
 * Use these to select only the specific state needed by components.
 */

// Basic state selectors
export const selectTrips = (state: TripState) => state.trips;
export const selectError = (state: TripState) => state.error;
export const selectSelectedTrip = (state: TripState) => state.selectedTrip;

// Per-operation loading selectors
export const selectIsCreating = (state: TripState) => state.isCreating;
export const selectIsFetching = (state: TripState) => state.isFetching;
export const selectIsUpdating = (state: TripState) => state.isUpdating;
export const selectIsDeleting = (state: TripState) => state.isDeleting;

/** Returns true if any operation is in progress. */
export const selectIsLoading = (state: TripState) =>
  state.isCreating || state.isFetching || state.isUpdating || state.isDeleting;

/** Backward-compatible selector: returns isFetching (most common use case). */
export const selectLoading = (state: TripState) => state.isFetching;

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
  declineInvitation: state.declineInvitation,
});

// Composite selectors (for common combinations)
export const selectTripsWithLoading = (state: TripState) => ({
  trips: state.trips,
  loading: state.isFetching,
  isCreating: state.isCreating,
  isFetching: state.isFetching,
  isUpdating: state.isUpdating,
  isDeleting: state.isDeleting,
  error: state.error,
});
