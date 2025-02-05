import { BaseEvent } from './events';

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
export interface CreateTodoResponse extends Todo {}
export interface UpdateTodoResponse extends Todo {}
export interface DeleteTodoResponse {
  id: string;
  success: boolean;
}