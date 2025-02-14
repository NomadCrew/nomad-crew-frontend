import { create } from 'zustand';
import { api } from '@/src/api/api-client';
import {
  Trip,
  CreateTripInput,
  UpdateTripInput,
  TripStatus,
  UpdateTripStatusRequest,
  UpdateTripStatusResponse,
} from '@/src/types/trip';
import { API_PATHS } from '@/src/utils/api-paths';
import { API_CONFIG } from '@/src/api/env';
import {
  WebSocketEvent,
  WebSocketConnectionState,
  isTripEvent,
  isTodoEvent,
  isWebSocketEvent,
} from '@/src/types/events';
import { useTodoStore } from '@/src/store/useTodoStore';
import { mapWeatherCode } from '@/src/utils/weather';
import { useAuthStore } from '@/src/store/useAuthStore';

interface TripState {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  // Removed wsConnection
  // Core operations
  createTrip: (input: CreateTripInput) => Promise<Trip>;
  updateTrip: (id: string, input: UpdateTripInput) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;
  // Read operations
  fetchTrips: () => Promise<void>;
  getTripById: (id: string) => Trip | undefined;
  // Status operations
  updateTripStatus: (id: string, status: TripStatus) => Promise<void>;
  // WebSocket operations (simplified)
  handleTripEvent: (event: WebSocketEvent) => void;
  // Removed connectToTrip/disconnectFromTrip
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
      const response = await api.patch<UpdateTripStatusResponse>(
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

  // WebSocket Operations
  handleTripEvent: (event: WebSocketEvent) => {
    if (isTripEvent(event)) {
      let updatedTrip: Partial<Trip> = {};

      if (event.type === 'WEATHER_UPDATED') {
        console.log(
          'Received WEATHER_UPDATED event for trip:',
          event.payload.tripId,
          'Temperature:', event.payload.temperature_2m,
          'Weather code:', event.payload.weather_code
        );
        updatedTrip = {
          weatherTemp: `${Math.round(event.payload.temperature_2m)}°C`,
          weatherCondition: mapWeatherCode(event.payload.weather_code),
          id: event.payload.tripId
        };
      } else if (event.type === 'TRIP_UPDATED') {
        updatedTrip = event.payload;
      }

      if (Object.keys(updatedTrip).length > 0) {
        set(state => ({
          trips: state.trips.map(trip => 
            trip.id === updatedTrip.id ? { ...trip, ...updatedTrip } : trip
          )
        }));
      }
    }
    
    if (isTodoEvent(event)) {
      useTodoStore.getState().handleTodoEvent(event);
    }
  },
}));