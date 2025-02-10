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
  wsConnection: WebSocketConnectionState | null;
  // Core operations
  createTrip: (input: CreateTripInput) => Promise<Trip>;
  updateTrip: (id: string, input: UpdateTripInput) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;
  // Read operations
  fetchTrips: () => Promise<void>;
  getTripById: (id: string) => Trip | undefined;
  // Status operations
  updateTripStatus: (id: string, status: TripStatus) => Promise<void>;
  // WebSocket operations
  connectToTrip: (tripId: string) => void;
  disconnectFromTrip: (tripId: string) => void;
  handleTripEvent: (event: WebSocketEvent) => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  loading: false,
  error: null,
  wsConnection: null,

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
  connectToTrip: (tripId: string) => {
    const MAX_RECONNECT_ATTEMPTS = 5;
    const BASE_DELAY = 3000; // 3 seconds
    
    const attemptReconnect = (currentAttempt: number) => {
      if (currentAttempt >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnect attempts reached');
        return;
      }

      const delay = BASE_DELAY * Math.pow(2, currentAttempt);
      console.log(`Reconnecting in ${delay/1000} seconds...`);
      
      setTimeout(() => {
        console.log('Attempting reconnect...');
        get().connectToTrip(tripId);
      }, delay);
    };

    try {
      const baseUrl = API_CONFIG.BASE_URL;
      if (!baseUrl) {
        console.error('No API base URL configured');
        return;
      }

      const token = useAuthStore.getState().token;
      if (!token) {
        console.error('No JWT token available');
        return;
      }

      const apiUrl = new URL(baseUrl);
      const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = new URL(`${protocol}//${apiUrl.host}/v1/trips/${tripId}/ws`);

      wsUrl.searchParams.set('apikey', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '');
      wsUrl.searchParams.set('token', token);

      console.log('Connecting to WebSocket:', wsUrl.toString());

      const connection = new WebSocket(wsUrl.toString());

      connection.onopen = () => {
        console.log('WebSocket connection established');
        set({ 
          wsConnection: { 
            instance: connection, 
            status: 'CONNECTED',
            reconnectAttempt: 0 
          } 
        });
      };

      connection.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (isWebSocketEvent(parsed)) {
            get().handleTripEvent(parsed);
          }
        } catch (error) {
          console.error('Message parsing error:', error);
        }
      };

      connection.onerror = (error) => {
        console.error('WebSocket error:', error);
        const currentAttempt = get().wsConnection?.reconnectAttempt || 0;
        set({ 
          wsConnection: { 
            instance: null, 
            status: 'ERROR',
            reconnectAttempt: currentAttempt + 1 
          } 
        });
        attemptReconnect(currentAttempt + 1);
      };

      connection.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
        const currentAttempt = get().wsConnection?.reconnectAttempt || 0;
        
        if (event.code !== 1000) { // Only reconnect for abnormal closures
          set({
            wsConnection: {
              instance: null,
              status: 'RECONNECTING',
              reconnectAttempt: currentAttempt + 1
            }
          });
          attemptReconnect(currentAttempt + 1);
        } else {
          set({ wsConnection: null });
        }
      };

    } catch (error) {
      console.error('Connection failed:', error);
      const currentAttempt = get().wsConnection?.reconnectAttempt || 0;
      set({ 
        wsConnection: { 
          instance: null, 
          status: 'ERROR',
          reconnectAttempt: currentAttempt + 1 
        } 
      });
      attemptReconnect(currentAttempt + 1);
    }
  },

  disconnectFromTrip: (tripId: string) => {
    const { wsConnection } = get();
    if (wsConnection?.instance) {
      wsConnection.instance.close();
      set({ wsConnection: null });
    }
  },

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