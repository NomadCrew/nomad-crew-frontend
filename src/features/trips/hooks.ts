import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { tripApi } from './api';
import { tripKeys } from './queries';
import { Trip, CreateTripInput, UpdateTripInput, TripStatus } from './types';
import { logger } from '@/src/utils/logger';

/**
 * Trip TanStack Query Hooks
 *
 * These hooks provide a declarative API for fetching and mutating trip data.
 * They handle caching, background refetching, and optimistic updates automatically.
 *
 * Server state is managed by TanStack Query, while UI state (selectedTrip, etc.)
 * remains in the Zustand store.
 */

/**
 * Fetch all trips for the current user
 *
 * @example
 * const { data: trips, isLoading, error } = useTrips();
 */
export const useTrips = () => {
  return useQuery({
    queryKey: tripKeys.lists(),
    queryFn: tripApi.getAll,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
};

/**
 * Fetch a single trip by ID
 *
 * @param id - Trip ID
 * @param options - Additional query options
 *
 * @example
 * const { data: trip, isLoading } = useTrip(tripId);
 */
export const useTrip = (
  id: string,
  options?: Omit<UseQueryOptions<Trip>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: () => tripApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    ...options,
  });
};

/**
 * Create a new trip
 *
 * Automatically invalidates the trips list cache on success.
 *
 * @example
 * const createTrip = useCreateTrip();
 * createTrip.mutate(tripInput, {
 *   onSuccess: (newTrip) => {
 *     console.log('Trip created:', newTrip);
 *   }
 * });
 */
export const useCreateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tripApi.create,
    onSuccess: (newTrip) => {
      logger.info('TRIP', 'Trip created successfully:', newTrip);

      // Invalidate and refetch trips list
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });

      // Optionally set the new trip data in cache
      queryClient.setQueryData(tripKeys.detail(newTrip.id), newTrip);
    },
    onError: (error) => {
      logger.error('TRIP', 'Failed to create trip:', error);
    },
  });
};

/**
 * Update an existing trip
 *
 * Uses optimistic updates to immediately reflect changes in the UI.
 * Automatically invalidates related caches on success.
 *
 * @example
 * const updateTrip = useUpdateTrip();
 * updateTrip.mutate({ id: tripId, input: { name: 'Updated Name' } });
 */
export const useUpdateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTripInput }) =>
      tripApi.update(id, input),
    // Optimistic update: immediately update the cache before the request completes
    onMutate: async ({ id, input }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: tripKeys.detail(id) });

      // Snapshot the previous value
      const previousTrip = queryClient.getQueryData<Trip>(tripKeys.detail(id));

      // Optimistically update to the new value
      if (previousTrip) {
        queryClient.setQueryData<Trip>(tripKeys.detail(id), {
          ...previousTrip,
          ...input,
        });
      }

      // Return context with the previous value
      return { previousTrip, id };
    },
    // If mutation fails, rollback to the previous value
    onError: (error, variables, context) => {
      logger.error('TRIP', 'Failed to update trip:', error);
      if (context?.previousTrip) {
        queryClient.setQueryData(tripKeys.detail(context.id), context.previousTrip);
      }
    },
    // After success, invalidate to ensure fresh data
    onSuccess: (updatedTrip) => {
      logger.info('TRIP', 'Trip updated successfully:', updatedTrip);
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      queryClient.setQueryData(tripKeys.detail(updatedTrip.id), updatedTrip);
    },
  });
};

/**
 * Delete a trip
 *
 * Uses optimistic updates to remove the trip from the list immediately.
 *
 * @example
 * const deleteTrip = useDeleteTrip();
 * deleteTrip.mutate(tripId);
 */
export const useDeleteTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tripApi.delete,
    // Optimistic update: remove from list immediately
    onMutate: async (tripId) => {
      await queryClient.cancelQueries({ queryKey: tripKeys.lists() });

      const previousTrips = queryClient.getQueryData<Trip[]>(tripKeys.lists());

      if (previousTrips) {
        queryClient.setQueryData<Trip[]>(
          tripKeys.lists(),
          previousTrips.filter((trip) => trip.id !== tripId)
        );
      }

      return { previousTrips, tripId };
    },
    onError: (error, tripId, context) => {
      logger.error('TRIP', 'Failed to delete trip:', error);
      if (context?.previousTrips) {
        queryClient.setQueryData(tripKeys.lists(), context.previousTrips);
      }
    },
    onSuccess: (_, tripId) => {
      logger.info('TRIP', 'Trip deleted successfully:', tripId);
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      queryClient.removeQueries({ queryKey: tripKeys.detail(tripId) });
    },
  });
};

/**
 * Update trip status
 *
 * Uses optimistic updates to immediately reflect status changes.
 *
 * @example
 * const updateStatus = useUpdateTripStatus();
 * updateStatus.mutate({ id: tripId, status: 'ACTIVE' });
 */
export const useUpdateTripStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TripStatus }) =>
      tripApi.updateStatus(id, status),
    // Optimistic update
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: tripKeys.detail(id) });

      const previousTrip = queryClient.getQueryData<Trip>(tripKeys.detail(id));

      if (previousTrip) {
        queryClient.setQueryData<Trip>(tripKeys.detail(id), {
          ...previousTrip,
          status,
        });
      }

      return { previousTrip, id };
    },
    onError: (error, variables, context) => {
      logger.error('TRIP', 'Failed to update trip status:', error);
      if (context?.previousTrip) {
        queryClient.setQueryData(tripKeys.detail(context.id), context.previousTrip);
      }
    },
    onSuccess: (updatedTrip) => {
      logger.info('TRIP', 'Trip status updated successfully:', updatedTrip);
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      queryClient.setQueryData(tripKeys.detail(updatedTrip.id), updatedTrip);
    },
  });
};

/**
 * Invite a member to a trip
 *
 * @example
 * const inviteMember = useInviteMember();
 * inviteMember.mutate({ tripId, email, role: 'member' });
 */
export const useInviteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      email,
      role,
    }: {
      tripId: string;
      email: string;
      role: 'owner' | 'admin' | 'member';
    }) => tripApi.inviteMember(tripId, email, role),
    onSuccess: (_, { tripId }) => {
      logger.info('TRIP', 'Member invited successfully');
      // Invalidate trip details to refetch with new invitation
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
    },
    onError: (error) => {
      logger.error('TRIP', 'Failed to invite member:', error);
    },
  });
};

/**
 * Accept a trip invitation
 *
 * @example
 * const acceptInvitation = useAcceptInvitation();
 * acceptInvitation.mutate(invitationToken);
 */
export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tripApi.acceptInvitation,
    onSuccess: () => {
      logger.info('TRIP', 'Invitation accepted successfully');
      // Invalidate trips list to refetch with newly joined trip
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
    onError: (error) => {
      logger.error('TRIP', 'Failed to accept invitation:', error);
    },
  });
};
