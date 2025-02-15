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
import { ServerEvent, isTripEvent, isTodoEvent, isWeatherEvent } from '@/src/types/events';
import { useTodoStore } from '@/src/store/useTodoStore';
import { mapWeatherCode } from '@/src/utils/weather';

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
  // WebSocket operations
  handleTripEvent: (event: ServerEvent) => void;
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
          tripId: event.tripID,
          type: event.type
         });
         set(state => ({
          trips: state.trips.map(trip =>
           trip.id === event.tripID ? {
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
        tripId: event.tripID,
        type: event.type
      });
      useTodoStore.getState().handleTodoEvent(event);
    }
  },
}));