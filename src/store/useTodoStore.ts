import { create } from 'zustand';
import { api } from '@/src/api/api-client';
import EventSource, { EventSourceListener } from "react-native-sse";
import "react-native-url-polyfill/auto";
import { Todo, CreateTodoInput, UpdateTodoInput, TodosResponse } from '@/src/types/todo';
import { useAuthStore } from '@/src/store/useAuthStore';

interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  eventSource: EventSource | null;
  connectionState: 'CONNECTING' | 'OPEN' | 'CLOSED';
  
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

type TodoEvents = "event";

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  loading: false,
  error: null,
  total: 0,
  hasMore: true,
  eventSource: null,
  connectionState: 'CONNECTING',
  
  createTodo: async (input) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<Todo>(`/v1/trips/${input.tripId}/todos`, input);
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
    set({ loading: true, error: null });
    try {
      const response = await api.put<Todo>(`/v1/trips/${id}/todos`, input);
      set(state => ({
        todos: state.todos.map(todo => 
          todo.id === id ? { ...todo, ...response.data } : todo
        )
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
    set({ loading: true, error: null });
    try {
      await api.delete(`/v1/trips/${id}/todos`);
      set(state => ({
        todos: state.todos.filter(todo => todo.id !== id),
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
        `/v1/trips/${tripId}/todos?offset=${offset}&limit=${limit}`
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
    const state = get();
    if (state.eventSource) {
      state.eventSource.removeAllEventListeners();
      state.eventSource.close();
    }

    const url = new URL(`${api.defaults.baseURL}/v1/trips/${tripId}/todos/stream`);

    const token = useAuthStore.getState().token;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!token || !anonKey) {
      console.error('Missing authentication credentials for SSE');
      set({ error: 'Authentication failed' });
      return;
    }

    const eventSource = new EventSource<TodoEvents>(url, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

    const listener: EventSourceListener<TodoEvents> = (event) => {
      if (event.type === 'event') {
        try {
          if (!event.data) {
            console.error('Received empty SSE event data');
            return;
          }
          const data = JSON.parse(event.data);
          const state = get();
          
          switch (data.type) {
            case 'TODO_CREATED':
              set({ todos: [data.payload, ...state.todos] });
              break;
            case 'TODO_UPDATED':
              set({
                todos: state.todos.map(todo =>
                  todo.id === data.payload.id ? data.payload : todo
                )
              });
              break;
            case 'TODO_DELETED':
              set({
                todos: state.todos.filter(todo => todo.id !== data.payload.id)
              });
              break;
          }
        } catch (error) {
          console.error('Error processing SSE event:', error);
        }
      }
    };

    eventSource.addEventListener("event", listener);
    eventSource.addEventListener("error", (event) => {
      if (event.type === "error") {
        console.error("SSE Connection error:", event.message);
        set({ connectionState: 'CLOSED' });
      } else if (event.type === "exception") {
        console.error("SSE Error:", event.message, event.error);
        set({ connectionState: 'CLOSED' });
      }
    });

    eventSource.addEventListener("open", () => {
      set({ connectionState: 'OPEN' });
    });

    // Store eventSource reference for cleanup
    set({ eventSource, connectionState: 'CONNECTING' });
  },

  unsubscribeFromTodoEvents: () => {
    const state = get();
    if (state.eventSource) {
      state.eventSource.removeAllEventListeners();
      state.eventSource.close();
      set({ eventSource: null, connectionState: 'CLOSED' });
    }
  }
}));