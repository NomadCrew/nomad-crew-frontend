import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import {
  Trip,
  CreateTripInput,
  UpdateTripInput,
  TripStatus,
  UpdateTripStatusRequest,
} from './types';
import { normalizeTrip } from './adapters/normalizeTrip';
import { useAuthStore } from '@/src/features/auth/store';

/**
 * Trip API Service Layer
 *
 * Handles all API calls related to trips, separated from state management.
 * All functions return normalized Trip objects using the normalizeTrip adapter.
 */
export const tripApi = {
  /**
   * Fetch all trips for the current user
   */
  getAll: async (): Promise<Trip[]> => {
    const response = await api.get<Trip[]>(API_PATHS.trips.list);
    return response.data.map(normalizeTrip);
  },

  /**
   * Fetch a single trip by ID
   */
  getById: async (id: string): Promise<Trip> => {
    const response = await api.get<Trip>(API_PATHS.trips.byId(id));
    return normalizeTrip(response.data);
  },

  /**
   * Create a new trip
   */
  create: async (input: CreateTripInput): Promise<Trip> => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      throw new Error('User must be logged in to create a trip');
    }

    // Transform payload to match backend expectations
    const payload = {
      name: input.name,
      description: input.description,
      destinationPlaceId: input.destination.placeId,
      destinationAddress: input.destination.address,
      destinationName: input.destination.address, // fallback if no name field
      destinationLatitude: input.destination.coordinates?.lat,
      destinationLongitude: input.destination.coordinates?.lng,
      startDate: input.startDate instanceof Date ? input.startDate.toISOString() : input.startDate,
      endDate: input.endDate instanceof Date ? input.endDate.toISOString() : input.endDate,
    };

    const response = await api.post<Trip>(API_PATHS.trips.create, payload);
    return normalizeTrip(response.data);
  },

  /**
   * Update an existing trip
   */
  update: async (id: string, input: UpdateTripInput): Promise<Trip> => {
    const response = await api.put<Trip>(API_PATHS.trips.byId(id), input);
    return normalizeTrip(response.data);
  },

  /**
   * Delete a trip
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(API_PATHS.trips.byId(id));
  },

  /**
   * Update trip status (PLANNING, ACTIVE, COMPLETED, CANCELLED)
   */
  updateStatus: async (id: string, status: TripStatus): Promise<Trip> => {
    const requestBody: UpdateTripStatusRequest = { status };
    const response = await api.patch<Trip>(API_PATHS.trips.updateStatus(id), requestBody);
    return normalizeTrip(response.data);
  },

  /**
   * Invite a member to a trip
   */
  inviteMember: async (
    tripId: string,
    email: string,
    role: 'owner' | 'admin' | 'member'
  ): Promise<void> => {
    await api.post(API_PATHS.trips.invite(tripId), { email, role });
  },

  /**
   * Accept a trip invitation
   */
  acceptInvitation: async (token: string): Promise<void> => {
    await api.post(API_PATHS.trips.acceptInvitation, { token });
  },

  // Member operations (TODO: implement when backend endpoints are ready)
  revokeInvitation: async (tripId: string, invitationId: string): Promise<void> => {
    // TODO: Add revoke invitation endpoint to API_PATHS.trips if available
    // await api.delete(API_PATHS.trips.revokeInvitation(tripId, invitationId));
    throw new Error('Not implemented');
  },

  updateMemberRole: async (
    tripId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member'
  ): Promise<void> => {
    // TODO: Add update member role endpoint to API_PATHS.trips if available
    // await api.patch(API_PATHS.trips.updateMemberRole(tripId, userId), { role });
    throw new Error('Not implemented');
  },

  removeMember: async (tripId: string, userId: string): Promise<void> => {
    // TODO: Add remove member endpoint to API_PATHS.trips if available
    // await api.delete(API_PATHS.trips.removeMember(tripId, userId));
    throw new Error('Not implemented');
  },
};
