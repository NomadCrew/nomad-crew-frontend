export type TodoStatus = 'COMPLETE' | 'INCOMPLETE';

export interface Todo {
  id: string;
  tripId: string;
  text: string;
  status: TodoStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  tripId: string;
  text: string;
}

export interface UpdateTodoInput {
  status?: TodoStatus;
  text?: string;
}

export interface ListTodosParams {
  limit: number;
  offset: number;
}

export interface TodosResponse {
  data: Todo[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export type TodoEventType = 'TODO_CREATED' | 'TODO_UPDATED' | 'TODO_DELETED';

export interface BaseTodoEvent {
  type: TodoEventType;
  timestamp: string;
}

export interface TodoCreatedEvent extends BaseTodoEvent {
  type: 'TODO_CREATED';
  payload: Todo;
}

export interface TodoUpdatedEvent extends BaseTodoEvent {
  type: 'TODO_UPDATED';
  payload: Todo;
}

export interface TodoDeletedEvent extends BaseTodoEvent {
  type: 'TODO_DELETED';
  payload: { id: string };
}

export type TodoEvent = TodoCreatedEvent | TodoUpdatedEvent | TodoDeletedEvent;

// Type guards
export const isValidTodoEvent = (event: unknown): event is TodoEvent => {
  if (!event || typeof event !== 'object') return false;
  
  const { type, payload } = event as TodoEvent;
  
  if (!type || !payload) return false;
  
  switch (type) {
    case 'TODO_CREATED':
    case 'TODO_UPDATED':
      return isTodo(payload);
    case 'TODO_DELETED':
      return typeof (payload as { id: string }).id === 'string';
    default:
      return false;
  }
};

const isTodo = (value: unknown): value is Todo => {
  if (!value || typeof value !== 'object') return false;
  
  const todo = value as Todo;
  return (
    typeof todo.id === 'string' &&
    typeof todo.tripId === 'string' &&
    typeof todo.text === 'string' &&
    (todo.status === 'COMPLETE' || todo.status === 'INCOMPLETE') &&
    typeof todo.createdBy === 'string' &&
    typeof todo.createdAt === 'string' &&
    typeof todo.updatedAt === 'string'
  );
};