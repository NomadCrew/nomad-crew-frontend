import { create } from 'zustand';
import { api } from '@/src/api/config';

export interface Trip {
  id: number;
  name: string;
  description: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TripState {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  createTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  fetchTrips: () => Promise<void>;
  deleteTrip: (id: number) => Promise<void>;
  updateTrip: (id: number, trip: Partial<Trip>) => Promise<void>;
}

export const useTripStore = create<TripState>((set) => ({
  trips: [],
  loading: false,
  error: null,

  createTrip: async (tripData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/v1/trips', tripData);
      const newTrip = response.data;
      set(state => ({
        trips: [...state.trips, {
          ...newTrip,
          startDate: new Date(newTrip.startDate),
          endDate: new Date(newTrip.endDate),
          createdAt: new Date(newTrip.createdAt),
          updatedAt: new Date(newTrip.updatedAt),
        }],
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create trip';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchTrips: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/v1/trips/list');
      const trips = response.data.map((trip: any) => ({
        ...trip,
        startDate: new Date(trip.startDate),
        endDate: new Date(trip.endDate),
        createdAt: new Date(trip.createdAt),
        updatedAt: new Date(trip.updatedAt),
      }));
      set({ trips });
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

  updateTrip: async (id, tripData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/v1/trips/${id}`, tripData);
      const updatedTrip = response.data;
      set(state => ({
        trips: state.trips.map(trip => 
          trip.id === id ? {
            ...trip,
            ...updatedTrip,
            startDate: new Date(updatedTrip.startDate),
            endDate: new Date(updatedTrip.endDate),
            updatedAt: new Date(updatedTrip.updatedAt),
          } : trip
        )
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update trip';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));