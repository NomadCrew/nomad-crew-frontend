import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { Todo, CreateTodoInput, UpdateTodoInput, TodosResponse } from './types';

/**
 * Todo API Service Layer
 *
 * Handles all API calls related to todos, separated from state management.
 * All functions return Todo objects directly from the API.
 */
export const todoApi = {
  /**
   * Fetch all todos for a specific trip with pagination
   */
  getAll: async (
    tripId: string,
    offset: number = 0,
    limit: number = 50
  ): Promise<TodosResponse> => {
    const response = await api.get<TodosResponse>(
      `${API_PATHS.todos.list(tripId)}?offset=${offset}&limit=${limit}`
    );
    return response.data;
  },

  /**
   * Create a new todo
   */
  create: async (input: CreateTodoInput): Promise<Todo> => {
    const response = await api.post<Todo>(API_PATHS.todos.create(input.tripId), input);
    return response.data;
  },

  /**
   * Update an existing todo
   */
  update: async (tripId: string, id: string, input: UpdateTodoInput): Promise<Todo> => {
    const response = await api.put<Todo>(API_PATHS.todos.update(tripId, id), input);
    return response.data;
  },

  /**
   * Delete a todo
   */
  delete: async (tripId: string, id: string): Promise<void> => {
    await api.delete(API_PATHS.todos.delete(tripId, id));
  },

  /**
   * Toggle todo completion status
   */
  toggleComplete: async (tripId: string, id: string, currentStatus: boolean): Promise<Todo> => {
    const newStatus = currentStatus ? 'INCOMPLETE' : 'COMPLETE';
    const response = await api.put<Todo>(API_PATHS.todos.update(tripId, id), { status: newStatus });
    return response.data;
  },
};
