import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from './api';
import { todoKeys } from './queries';
import { Todo, CreateTodoInput, UpdateTodoInput } from './types';
import { logger } from '@/src/utils/logger';

/**
 * Todo TanStack Query Hooks
 *
 * These hooks provide a declarative API for fetching and mutating todo data.
 * They handle caching, background refetching, and optimistic updates automatically.
 *
 * Server state is managed by TanStack Query, while UI state (filters, selected items, etc.)
 * can remain in the Zustand store if needed.
 */

/**
 * Fetch all todos for a specific trip with pagination
 *
 * @param tripId - Trip ID to fetch todos for
 * @param offset - Pagination offset (default: 0)
 * @param limit - Pagination limit (default: 50)
 *
 * @example
 * const { data, isLoading, error } = useTodos(tripId);
 * const todos = data?.data ?? [];
 * const pagination = data?.pagination;
 */
export const useTodos = (tripId: string, offset: number = 0, limit: number = 50) => {
  return useQuery({
    queryKey: todoKeys.list(tripId, offset, limit),
    queryFn: () => todoApi.getAll(tripId, offset, limit),
    enabled: !!tripId,
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
  });
};

/**
 * Create a new todo
 *
 * Automatically invalidates the todos list cache on success.
 *
 * @example
 * const createTodo = useCreateTodo();
 * createTodo.mutate({ tripId, text: 'Buy groceries' }, {
 *   onSuccess: (newTodo) => {
 *     console.log('Todo created:', newTodo);
 *   }
 * });
 */
export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: todoApi.create,
    onSuccess: (newTodo) => {
      logger.info('TODO', 'Todo created successfully:', newTodo);

      // Invalidate and refetch todos list for this trip
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
    onError: (error) => {
      logger.error('TODO', 'Failed to create todo:', error);
    },
  });
};

/**
 * Update an existing todo
 *
 * Uses optimistic updates to immediately reflect changes in the UI.
 * Automatically invalidates related caches on success.
 *
 * @example
 * const updateTodo = useUpdateTodo();
 * updateTodo.mutate({ tripId, id: todoId, input: { text: 'Updated text' } });
 */
export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tripId, id, input }: { tripId: string; id: string; input: UpdateTodoInput }) =>
      todoApi.update(tripId, id, input),
    // Optimistic update: immediately update the cache before the request completes
    onMutate: async ({ tripId, id, input }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      // Snapshot the previous value
      const previousTodos = queryClient.getQueriesData({ queryKey: todoKeys.lists() });

      // Optimistically update all matching queries
      queryClient.setQueriesData({ queryKey: todoKeys.lists() }, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((todo: Todo) => (todo.id === id ? { ...todo, ...input } : todo)),
        };
      });

      // Return context with the previous value for rollback
      return { previousTodos, tripId, id };
    },
    // If mutation fails, rollback to the previous value
    onError: (error, variables, context) => {
      logger.error('TODO', 'Failed to update todo:', error);
      if (context?.previousTodos) {
        context.previousTodos.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    // After success, invalidate to ensure fresh data
    onSuccess: (updatedTodo, { tripId }) => {
      logger.info('TODO', 'Todo updated successfully:', updatedTodo);
      queryClient.invalidateQueries({ queryKey: todoKeys.list(tripId) });
    },
  });
};

/**
 * Delete a todo
 *
 * Uses optimistic updates to remove the todo from the list immediately.
 *
 * @example
 * const deleteTodo = useDeleteTodo();
 * deleteTodo.mutate({ tripId, id: todoId });
 */
export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tripId, id }: { tripId: string; id: string }) => todoApi.delete(tripId, id),
    // Optimistic update: remove from list immediately
    onMutate: async ({ tripId, id }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      const previousTodos = queryClient.getQueriesData({ queryKey: todoKeys.lists() });

      // Optimistically remove the todo from all matching queries
      queryClient.setQueriesData({ queryKey: todoKeys.lists() }, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((todo: Todo) => todo.id !== id),
          pagination: {
            ...old.pagination,
            total: Math.max(0, old.pagination.total - 1),
          },
        };
      });

      return { previousTodos, tripId, id };
    },
    onError: (error, variables, context) => {
      logger.error('TODO', 'Failed to delete todo:', error);
      if (context?.previousTodos) {
        context.previousTodos.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (_, { tripId, id }) => {
      logger.info('TODO', 'Todo deleted successfully:', id);
      queryClient.invalidateQueries({ queryKey: todoKeys.list(tripId) });
    },
  });
};

/**
 * Toggle todo completion status
 *
 * Uses optimistic updates to immediately reflect status changes.
 *
 * @example
 * const toggleTodo = useToggleTodo();
 * toggleTodo.mutate({ tripId, id: todoId, currentStatus: 'INCOMPLETE' });
 */
export const useToggleTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      id,
      currentStatus,
    }: {
      tripId: string;
      id: string;
      currentStatus: 'COMPLETE' | 'INCOMPLETE';
    }) => todoApi.toggleComplete(tripId, id, currentStatus === 'COMPLETE'),
    // Optimistic update
    onMutate: async ({ tripId, id, currentStatus }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      const previousTodos = queryClient.getQueriesData({ queryKey: todoKeys.lists() });

      const newStatus = currentStatus === 'COMPLETE' ? 'INCOMPLETE' : 'COMPLETE';

      // Optimistically toggle the status in all matching queries
      queryClient.setQueriesData({ queryKey: todoKeys.lists() }, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((todo: Todo) =>
            todo.id === id ? { ...todo, status: newStatus } : todo
          ),
        };
      });

      return { previousTodos, tripId, id };
    },
    onError: (error, variables, context) => {
      logger.error('TODO', 'Failed to toggle todo:', error);
      if (context?.previousTodos) {
        context.previousTodos.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (updatedTodo, { tripId }) => {
      logger.info('TODO', 'Todo toggled successfully:', updatedTodo);
      queryClient.invalidateQueries({ queryKey: todoKeys.list(tripId) });
    },
  });
};
