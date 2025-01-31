import { create } from 'zustand';
import { api } from '@/src/api/api-client';
import { EventSourceManager, ConnectionState } from '@/src/hooks/useEventSource';
import { useAuthStore } from '@/src/store/useAuthStore';
import { Todo, CreateTodoInput, UpdateTodoInput, TodosResponse } from '@/src/types/todo';
import { API_PATHS } from '@/src/utils/api-paths';

interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  connectionState: ConnectionState;
  processedEvents: Set<string>;
  eventSourceManager: EventSourceManager | null;
  
  // Core operations
  createTodo: (input: CreateTodoInput) => Promise<Todo>;
  updateTodo: (id: string, input: UpdateTodoInput) => Promise<Todo>;
  deleteTodo: (id: string) => Promise<void>;
  
  // List operations with pagination
  fetchTodos: (tripId: string, offset: number, limit: number) => Promise<void>;
  
  // SSE operations
  subscribeToTodoEvents: (tripId: string) => void;
  unsubscribeFromTodoEvents: () => void;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  eventSourceManager: null,
  todos: [],
  loading: false,
  error: null,
  total: 0,
  hasMore: true,
  connectionState: 'CLOSED',
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

  subscribeToTodoEvents: (tripId) => {
    const token = useAuthStore.getState().token;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!token || !anonKey) {
      console.error('Missing authentication credentials for SSE');
      set({ error: 'Authentication failed' });
      return;
    }
    // Clear processed events on new subscription
    set({ processedEvents: new Set() });

    const url = `${api.defaults.baseURL}${API_PATHS.todos.stream(tripId)}`;
    // If an existing connection exists, disconnect first
    if (get().eventSourceManager) {
      get().eventSourceManager.disconnect();
    }

    const manager = new EventSourceManager({
      url,
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/event-stream',
      },
      onEvent: (data) => {
        // Use an immutable update for processedEvents
        set((state) => {
          if (state.processedEvents.has(data.id)) {
            return {};
          }
          const newProcessedEvents = new Set(state.processedEvents);
          newProcessedEvents.add(data.id);
          let updatedTodos = state.todos;
          switch (data.type) {
            case 'TODO_CREATED':
              if (!state.todos.find(t => t.id === data.payload.id)) {
                updatedTodos = [data.payload, ...state.todos];
              }
              return { todos: updatedTodos, total: state.total + 1, processedEvents: newProcessedEvents };
            case 'TODO_UPDATED':
              updatedTodos = state.todos.map(todo =>
                todo.id === data.payload.id ? data.payload : todo
              );
              return { todos: updatedTodos, processedEvents: newProcessedEvents };
            case 'TODO_DELETED':
              updatedTodos = state.todos.filter(todo => todo.id !== data.payload.id);
              return { todos: updatedTodos, total: state.total - 1, processedEvents: newProcessedEvents };
            default:
              return { processedEvents: newProcessedEvents };
          }
        });
      },
      onError: (error) => {
        console.error('SSE Error:', error);
        set({ connectionState: 'CLOSED' });
      },
      onOpen: () => {
        set({ connectionState: 'OPEN' });
      },
      onStateChange: (state: ConnectionState) => {
        set({ connectionState: state });
      }
    });

    manager.connect();
    set({
      eventSourceManager: manager,
      connectionState: 'CONNECTING'
    });
  },

  unsubscribeFromTodoEvents: () => {
    const { eventSourceManager } = get();
    if (eventSourceManager) {
      eventSourceManager.disconnect();
      set({
        eventSourceManager: null,
        connectionState: 'CLOSED'
      });
    }
  }
}));
