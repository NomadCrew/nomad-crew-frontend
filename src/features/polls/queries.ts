/**
 * Poll Query Keys
 *
 * Centralized query key factory following TanStack Query best practices.
 * Keys are structured hierarchically for efficient cache invalidation.
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 *
 * Structure:
 * - polls: all poll-related queries
 * - polls.lists: all list queries
 * - polls.list(tripId): specific list for a trip
 * - polls.details: all detail queries
 * - polls.detail(pollId): specific detail query
 */
export const pollKeys = {
  /**
   * Base key for all poll queries
   */
  all: ['polls'] as const,

  /**
   * All list queries
   */
  lists: () => [...pollKeys.all, 'list'] as const,

  /**
   * Specific list query for a trip with pagination parameters
   */
  list: (tripId: string, offset?: number, limit?: number) =>
    [...pollKeys.lists(), tripId, { offset, limit }] as const,

  /**
   * All detail queries
   */
  details: () => [...pollKeys.all, 'detail'] as const,

  /**
   * Specific detail query by poll ID
   */
  detail: (pollId: string) => [...pollKeys.details(), pollId] as const,
};
