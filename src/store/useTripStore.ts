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
import {
  WebSocketEvent,
  WebSocketConnectionState,
  isTripEvent,
  isTodoEvent,
} from '@/src/types/events';
import { useTodoStore } from '@/src/store/useTodoStore';

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
    const { wsConnection } = get();
    if (wsConnection?.instance && wsConnection.instance.readyState === WebSocket.OPEN) {
      return;
    }

    // Create URL object from existing base URL
    const apiUrl = new URL(api.defaults.baseURL!);
    // Replace host with localhost while preserving port
    const wsHost = `localhost:${apiUrl.port || (apiUrl.protocol === 'https:' ? 443 : 80)}`;
    
    const wsUrl = `${api.defaults.baseURL}${API_PATHS.trips.ws(tripId)}`
      .replace(apiUrl.host, wsHost)  // Replace host for WS
      .replace('http', 'ws');

    console.log('Connecting to trip WebSocket:', wsUrl);
    try {
      const connection = new WebSocket(wsUrl);
      connection.onmessage = (event) => {
        console.log('Received WebSocket message:', event.data, 'for trip:', tripId);
        const tripEvent = JSON.parse(event.data);
        console.log('Parsed WebSocket event:', tripEvent);
        get().handleTripEvent(tripEvent);
      };
      connection.onerror = (errorEvent) => {
        set({ error: `WebSocket error: ${errorEvent.type}` });
      };
      connection.onclose = () => {
        set({ wsConnection: null });
      };
      set({ wsConnection: { instance: connection, status: 'CONNECTED', reconnectAttempt: 0 } });
    } catch (error) {
      console.error('Trip WebSocket connection failed:', error);
      set({ wsConnection: { instance: null, status: 'DISCONNECTED', reconnectAttempt: 0 } });
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
      const updatedTrip = event.type === 'WEATHER_UPDATED' 
        ? { ...event.payload } 
        : event.payload;

      set(state => ({
        trips: state.trips.map(trip =>
          trip.id === updatedTrip.id ? { ...trip, ...updatedTrip } : trip
        ),
      }));
    }
    
    if (isTodoEvent(event)) {
      // Forward todo events to todo store
      useTodoStore.getState().handleTodoEvent(event);
    }
  },
}));