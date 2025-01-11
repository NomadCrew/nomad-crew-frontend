import { create } from 'zustand';
import { api } from '@/src/api/api-client';
import {
  Trip,
  CreateTripInput,
  UpdateTripInput,
  TripStatus,
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
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  loading: false,
  error: null,

  createTrip: async (tripData: CreateTripInput) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<Trip>(API_PATHS.trips.create, tripData);
      set((state) => ({
        trips: [...state.trips, response.data],
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

  updateTripStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/v1/trips/${id}/status`, { status });
      set((state) => ({
        trips: state.trips.map((trip) =>
          trip.id === id ? { ...trip, status } : trip
        ),
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update trip status';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));