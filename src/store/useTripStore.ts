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
  // Status operations
  updateTripStatus: (id: string, status: TripStatus) => Promise<void>;
  connectionState: 'CONNECTING' | 'OPEN' | 'CLOSED';
  processedEvents: Set<string>;
  subscribeToTripEvents: (tripId: string) => void;
  unsubscribeFromTripEvents: () => void;
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
        status: 'PLANNING' as TripStatus,
      });
      set(state => ({
        trips: [...state.trips, response.data],
        loading: false,
      }));
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create trip';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTrip: async (id, input) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put<Trip>(`/v1/trips/${id}`, input);
      const updatedTrip = response.data;
      set((state) => ({
        trips: state.trips.map((trip) =>
          trip.id === id ? updatedTrip : trip
        ),
      }));
      return updatedTrip;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update trip';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchTrips: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<Trip[]>(API_PATHS.trips.list);
      set({ trips: response.data || [] });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch trips';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteTrip: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/v1/trips/${id}`);
      set((state) => ({
        trips: state.trips.filter((trip) => trip.id !== id),
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete trip';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getTripById: (id) => {
    return get().trips.find((trip) => trip.id === id);
  },

  updateTripStatus: async (id: string, status: TripStatus) => {
    set({ loading: true, error: null });
    try {
        const response = await api.patch<UpdateTripStatusResponse>(
            `${API_PATHS.trips.updateStatus(id)}`,
            { status } as UpdateTripStatusRequest
        );

        // Update trip in local state
        const trips = get().trips.map(trip => 
            trip.id === id ? { ...trip, status } : trip
        );
        
        set({ trips });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update trip status';
        set({ error: message });
        throw error;
    } finally {
        set({ loading: false });
    }
},
connectionState: 'CLOSED',
processedEvents: new Set(),

subscribeToTripEvents: (tripId: string) => {
  const url = `${api.defaults.baseURL}${API_PATHS.trips.stream(tripId)}`;
  
  useEventSource({
    url,
    onEvent: (data) => {
      // Skip if event already processed
      if (get().processedEvents.has(data.id)) {
        return;
      }

      set({ processedEvents: get().processedEvents.add(data.id) });
      
      switch (data.type) {
        case 'TRIP_UPDATED':
          set(state => ({
            trips: state.trips.map(trip =>
              trip.id === data.payload.id ? { ...trip, ...data.payload } : trip
            )
          }));
          break;
      }
    },
  });
},

unsubscribeFromTripEvents: () => {
  set({ connectionState: 'CLOSED' });
}
}));