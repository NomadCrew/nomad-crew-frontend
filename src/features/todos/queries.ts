/**
 * Todo Query Keys
 *
 * Centralized query key factory following TanStack Query best practices.
 * Keys are structured hierarchically for efficient cache invalidation.
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 *
 * Structure:
 * - todos: all todo-related queries
 * - todos.lists: all list queries
 * - todos.list(tripId): specific list for a trip
 * - todos.details: all detail queries
 * - todos.detail(id): specific detail query
 */
export const todoKeys = {
  /**
   * Base key for all todo queries
   */
  all: ['todos'] as const,

  /**
   * All list queries
   */
  lists: () => [...todoKeys.all, 'list'] as const,

  /**
   * Specific list query for a trip with pagination parameters
   */
  list: (tripId: string, offset?: number, limit?: number) =>
    [...todoKeys.lists(), tripId, { offset, limit }] as const,

  /**
   * All detail queries
   */
  details: () => [...todoKeys.all, 'detail'] as const,

  /**
   * Specific detail query by todo ID
   */
  detail: (id: string) => [...todoKeys.details(), id] as const,
};
