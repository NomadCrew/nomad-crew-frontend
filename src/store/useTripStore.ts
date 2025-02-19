import { create } from 'zustand';
import { api } from '@/src/api/api-client';
import {
  Trip,
  CreateTripInput,
  UpdateTripInput,
  TripStatus,
  UpdateTripStatusRequest,
  UpdateTripStatusResponse,
  WeatherForecast,
} from '@/src/types/trip';
import { API_PATHS } from '@/src/utils/api-paths';
import { ServerEvent, isTripEvent, isTodoEvent, isWeatherEvent, isMemberInviteEvent } from '@/src/types/events';
import { useTodoStore } from '@/src/store/useTodoStore';
import { mapWeatherCode } from '@/src/utils/weather';
import { apiClient } from '@/src/api/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/src/store/useAuthStore';

interface TripState {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  // Core operations
  createTrip: (input: CreateTripInput) => Promise<Trip>;
  updateTrip: (id: string, input: UpdateTripInput) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;
  // Read operations
  fetchTrips: () => Promise<void>;
  getTripById: (id: string) => Trip | undefined;
  // Member operations
  inviteMember: (tripId: string, email: string) => Promise<void>;
  revokeInvitation: (tripId: string, invitationId: string) => Promise<void>;
  // Status operations
  updateTripStatus: (id: string, status: TripStatus) => Promise<void>;
  // WebSocket operations
  handleTripEvent: (event: ServerEvent) => void;
  acceptInvitation: (token: string) => Promise<void>;
  checkPendingInvitations: () => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  loading: false,
  error: null,

  createTrip: async (tripData: CreateTripInput) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<Trip>(API_PATHS.trips.create, {
        ...tripData,
        destination: {
          address: tripData.destination.address,
          coordinates: tripData.destination.coordinates,
          placeId: tripData.destination.placeId
        },
        status: 'PLANNING' as TripStatus,
      });
      set(state => ({
        trips: [...state.trips, response.data],
        loading: false,
      }));
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create trip';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateTrip: async (id, input) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put<Trip>(`${API_PATHS.trips.byId(id)}`, input);
      const updatedTrip = response.data;
      set(state => ({
        trips: state.trips.map(trip => trip.id === id ? updatedTrip : trip),
        loading: false,
      }));
      return updatedTrip;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update trip';
      set({ error: message, loading: false });
      throw error;
    }
  },

  fetchTrips: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<Trip[]>(API_PATHS.trips.list);
      set({ 
        trips: response.data || [],
        loading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch trips';
      set({ error: message, loading: false });
      throw error;
    }
  },

  deleteTrip: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`${API_PATHS.trips.byId(id)}`);
      set(state => ({
        trips: state.trips.filter(trip => trip.id !== id),
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete trip';
      set({ error: message, loading: false });
      throw error;
    }
  },

  getTripById: (id) => {
    return get().trips.find(trip => trip.id === id);
  },

  updateTripStatus: async (id: string, status: TripStatus) => {
    set({ loading: true, error: null });
    try {
      await api.patch<UpdateTripStatusResponse>(
        `${API_PATHS.trips.updateStatus(id)}`,
        { status } as UpdateTripStatusRequest
      );
      
      set(state => ({
        trips: state.trips.map(trip => 
          trip.id === id ? { ...trip, status } : trip
        ),
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update trip status';
      set({ error: message, loading: false });
      throw error;
    }
  },

  handleTripEvent: (event: ServerEvent) => {
    if (isWeatherEvent(event)) {
      console.debug('[Weather] Update received:', {
        tripId: event.tripId,
        temp: event.payload.temperature_2m,
        code: event.payload.weather_code,
        forecasts: event.payload.hourly_forecast.length,
        timestamp: event.payload.timestamp
      });

      const weatherForecast: WeatherForecast[] = event.payload.hourly_forecast.map(hour => ({
        time: hour.timestamp,
        temperature: hour.temperature_2m,
        precipitation: hour.precipitation
      }));

      set(state => ({
        trips: state.trips.map(trip => 
          trip.id === event.tripId ? {
            ...trip,
            weatherTemp: `${Math.round(event.payload.temperature_2m)}°C`,
            weatherCondition: mapWeatherCode(event.payload.weather_code),
            weatherForecast,
            lastUpdated: event.payload.timestamp
          } : trip
        )
      }));
    } else if (isTripEvent(event)) {
         console.debug('[Trip] Update received:', {
          tripId: event.tripId,
          type: event.type
         });
         set(state => ({
          trips: state.trips.map(trip =>
           trip.id === event.tripId ? {
            ...trip,
            name: event.payload.name,
            description: event.payload.description,
            startDate: event.payload.startDate ?? trip.startDate,
            endDate: event.payload.endDate ?? trip.endDate,
            status: event.payload.status as TripStatus
           } : trip
          )
         }));
    } else if (isTodoEvent(event)) {
      console.debug('[Todo] Forwarding event:', {
        tripId: event.tripId,
        type: event.type
      });
      useTodoStore.getState().handleTodoEvent(event);
    } else if (isMemberInviteEvent(event)) {
      console.debug('[Member] Invitation sent:', {
        tripId: event.tripId,
        email: event.payload.inviteeEmail
      });
      
      set(state => ({
        trips: state.trips.map(trip => 
          trip.id === event.tripId ? {
            ...trip,
            invitations: [
              ...(trip.invitations || []), 
              {
                email: event.payload.inviteeEmail,
                status: 'pending',
                token: event.payload.invitationToken,
                expiresAt: event.payload.expiresAt
              }
            ]
          } : trip
        )
      }));
    }
  },

  inviteMember: async (tripId: string, email: string) => {
    try {
      await api.post(API_PATHS.trips.invite(tripId), {
        data: {
          email,
          role: 'MEMBER'
        }
      });
    } catch (error) {
      throw new Error('Failed to send invitation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  revokeInvitation: async (tripId: string, invitationId: string) => {
    // Implementation needed
  },

  acceptInvitation: async (token: string) => {
    try {
      const response = await apiClient.getAxiosInstance().post(API_PATHS.trips.acceptInvitation, {
        token
      });
      
      if (response.data.trip) {
        set(state => ({
          trips: [...state.trips, response.data.trip]
        }));
      }
      await AsyncStorage.removeItem('pendingInvitation');
      return response.data;
    } catch (error) {
      console.error('[TripStore] Accept invitation failed:', error);
      throw error;
    }
  },

  checkPendingInvitations: async () => {
    const token = await AsyncStorage.getItem('pendingInvitation');
    if (token && useAuthStore.getState().user) {
      get().acceptInvitation(token);
    }
  }
}));