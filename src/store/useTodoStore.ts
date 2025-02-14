import { create } from 'zustand';
import { api } from '@/src/api/api-client';
import { Todo, CreateTodoInput, UpdateTodoInput, TodosResponse } from '@/src/types/todo';
import { API_PATHS } from '@/src/utils/api-paths';
import { 
  WebSocketEvent,
  WebSocketConnectionState,
  isTodoEvent,
  TodoCreatedEvent,
  TodoUpdatedEvent,
  TodoDeletedEvent
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
  handleTodoEvent: (event: WebSocketEvent) => void;
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

  handleTodoEvent: (event: WebSocketEvent) => {
    if (isTodoEvent(event)) {
      // Prevent duplicate event processing
      if (get().processedEvents.has(event.id)) return;

      set(state => {
        const newProcessedEvents = new Set(state.processedEvents);
        newProcessedEvents.add(event.id);

        switch (event.type) {
          case 'TODO_CREATED': {
            const todoEvent = event as TodoCreatedEvent;
            return {
              todos: [todoEvent.payload, ...state.todos],
              total: state.total + 1,
              processedEvents: newProcessedEvents
            };
          }
          case 'TODO_UPDATED': {
            const todoEvent = event as TodoUpdatedEvent;
            return {
              todos: state.todos.map(todo => 
                todo.id === todoEvent.payload.id ? todoEvent.payload : todo
              ),
              processedEvents: newProcessedEvents
            };
          }
          case 'TODO_DELETED': {
            const todoEvent = event as TodoDeletedEvent;
            return {
              todos: state.todos.filter(todo => todo.id !== todoEvent.payload.id),
              total: state.total - 1,
              processedEvents: newProcessedEvents
            };
          }
          default:
            return { processedEvents: newProcessedEvents };
        }
      });
    }
  },
}));