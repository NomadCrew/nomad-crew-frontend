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
export type CreateTodoResponse = Todo
export type UpdateTodoResponse = Todo
export interface DeleteTodoResponse {
  id: string;
  success: boolean;
} 