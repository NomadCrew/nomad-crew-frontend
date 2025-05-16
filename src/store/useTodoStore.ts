import { create } from 'zustand';
import { api } from '@/src/api/api-client';
import { Todo, CreateTodoInput, UpdateTodoInput, TodosResponse } from '@/src/types/todo';
import { API_PATHS } from '@/src/utils/api-paths';
import { 
  ServerEvent,
  isTodoEvent
} from '@/src/types/events';

interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  processedEvents: Set<string>;
  
  // Core operations
  createTodo: (input: CreateTodoInput) => Promise<Todo>;
  updateTodo: (id: string, input: UpdateTodoInput) => Promise<Todo>;
  deleteTodo: (id: string) => Promise<void>;
  
  // List operations with pagination
  fetchTodos: (tripId: string, offset: number, limit: number) => Promise<void>;
  
  // WebSocket operations
  handleTodoEvent: (event: ServerEvent) => void;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  loading: false,
  error: null,
  total: 0,
  hasMore: true,
  processedEvents: new Set(),
  
  createTodo: async (input) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<Todo>(API_PATHS.todos.create(input.tripId), input);
      set(state => ({
        todos: [response.data, ...state.todos],
        total: state.total + 1
      }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create todo';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTodo: async (id, input) => {
    const todo = get().todos.find(t => t.id === id);
    if (!todo) throw new Error('Todo not found');

    set({ loading: true, error: null });
    try {
      const response = await api.put<Todo>(API_PATHS.todos.update(todo.tripId, id), input);
      set(state => ({
        todos: state.todos.map(t => t.id === id ? { ...t, ...response.data } : t)
      }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update todo';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteTodo: async (id) => {
    const todo = get().todos.find(t => t.id === id);
    if (!todo) return;

    set({ loading: true, error: null });
    try {
      await api.delete(API_PATHS.todos.delete(todo.tripId, id));
      set(state => ({
        todos: state.todos.filter(t => t.id !== id),
        total: state.total - 1
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete todo';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchTodos: async (tripId, offset, limit) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<TodosResponse>(
        `${API_PATHS.todos.list(tripId)}?offset=${offset}&limit=${limit}`
      );
      const todoData = response.data.data ?? [];
      set(state => ({
        todos: offset === 0 ? todoData : [...state.todos, ...todoData],
        total: response.data.pagination.total,
        hasMore: todoData.length === limit,
        loading: false
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch todos';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  handleTodoEvent: (event: ServerEvent) => {
    if (
      event.type === 'TODO_CREATED' ||
      event.type === 'TODO_UPDATED' ||
      event.type === 'TODO_DELETED' ||
      event.type === 'TODO_COMPLETED'
    ) {
      // Prevent duplicate processing of the same event/todo
      if (get().processedEvents.has(event.id)) return;
      set((state) => {
        const newProcessedEvents = new Set(state.processedEvents);
        newProcessedEvents.add(event.id);
        switch (event.type) {
          case 'TODO_CREATED': {
            const todo = event.payload as Todo;
            // Only add if the todo isn't already present
            const exists = state.todos.some((t) => t.id === todo.id);
            return {
              todos: exists ? state.todos : [todo, ...state.todos],
              total: exists ? state.total : state.total + 1,
              processedEvents: newProcessedEvents,
            };
          }
          case 'TODO_UPDATED':
          case 'TODO_COMPLETED': {
            const todo = event.payload as Todo;
            return {
              todos: state.todos.map((t) => (t.id === todo.id ? { ...t, ...todo } : t)),
              processedEvents: newProcessedEvents,
            };
          }
          case 'TODO_DELETED': {
            const todo = event.payload as Todo;
            return {
              todos: state.todos.filter((t) => t.id !== todo.id),
              total: state.total - 1,
              processedEvents: newProcessedEvents,
            };
          }
          default:
            return { processedEvents: newProcessedEvents };
        }
      });
    }
  },
}));