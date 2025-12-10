import { TripStatus } from './types';

/**
 * Trip Query Keys
 *
 * Centralized query key factory following TanStack Query best practices.
 * Keys are structured hierarchically for efficient cache invalidation.
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 *
 * Structure:
 * - trips: all trip-related queries
 * - trips.lists: all list queries
 * - trips.list(filters): specific list with filters
 * - trips.details: all detail queries
 * - trips.detail(id): specific detail query
 */
export const tripKeys = {
  /**
   * Base key for all trip queries
   */
  all: ['trips'] as const,

  /**
   * All list queries
   */
  lists: () => [...tripKeys.all, 'list'] as const,

  /**
   * Specific list query with optional filters
   */
  list: (filters?: { status?: TripStatus; userId?: string }) =>
    [...tripKeys.lists(), filters] as const,

  /**
   * All detail queries
   */
  details: () => [...tripKeys.all, 'detail'] as const,

  /**
   * Specific detail query by trip ID
   */
  detail: (id: string) => [...tripKeys.details(), id] as const,

  /**
   * Invitations for a specific trip
   */
  invitations: (tripId: string) => [...tripKeys.all, 'invitations', tripId] as const,

  /**
   * Members for a specific trip
   */
  members: (tripId: string) => [...tripKeys.all, 'members', tripId] as const,
};
