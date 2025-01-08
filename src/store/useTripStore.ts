import { create } from 'zustand';
import { api } from '@/src/api/api-client';
import { Trip, CreateTripInput, UpdateTripInput, TripStatus } from '@/src/types/trip';
import { API_PATHS } from '@/src/utils/api-paths';

interface TripState {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  // Core operations
  createTrip: (input: CreateTripInput) => Promise<Trip>;
  updateTrip: (id: number, input: UpdateTripInput) => Promise<Trip>;
  deleteTrip: (id: number) => Promise<void>;
  // Read operations
  fetchTrips: () => Promise<void>;
  getTripById: (id: number) => Trip | undefined;
  // Status operations
  updateTripStatus: (id: number, status: TripStatus) => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  loading: false,
  error: null,

  createTrip: async (input) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(API_PATHS.trips.create, input);
      const newTrip = response.data;
      set(state => ({
        trips: [...state.trips, newTrip]
      }));
      return newTrip;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create trip';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTrip: async (id, input) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/v1/trips/${id}`, input);
      const updatedTrip = response.data;
      set(state => ({
        trips: state.trips.map(trip => 
          trip.id === id ? updatedTrip : trip
        )
      }));
      return updatedTrip;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update trip';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchTrips: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(API_PATHS.trips.list);
      set({ trips: response.data || [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch trips';
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
      set(state => ({
        trips: state.trips.filter(trip => trip.id !== id)
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete trip';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getTripById: (id) => {
    return get().trips.find(trip => trip.id === id);
  },

  updateTripStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/v1/trips/${id}/status`, { status });
      set(state => ({
        trips: state.trips.map(trip =>
          trip.id === id ? { ...trip, status } : trip
        )
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update trip status';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));