import { API_CONFIG } from '@/src/api/env';

export const createApiPath = (path: string) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/${API_CONFIG.VERSION}/${cleanPath}`;
};

// Define all API endpoints
export const API_PATHS = {
  auth: {
    login: '/login',
    logout: createApiPath('auth/logout'),
    refresh: createApiPath('auth/refresh'),
    validate: createApiPath('auth/validate'),
  },
  users: {
    create: createApiPath('users'),
    me: createApiPath('users/me'),
    byId: (id: string) => createApiPath(`users/${id}`),
  },
  trips: {
    list: createApiPath('trips/list'),
    create: createApiPath('trips'),
    byId: (id: string) => createApiPath(`trips/${id}`),
    updateStatus: (id: string) => `/v1/trips/${id}/status`,
    ws: (id: string) => `/v1/trips/${id}/ws`,
  },
  todos: {
    create: (tripId: string) => `/v1/trips/${tripId}/todos`,
    delete: (tripId: string, todoId: string) => `/v1/trips/${tripId}/todos/${todoId}`,
    list: (tripId: string) => `/v1/trips/${tripId}/todos`,
    update: (tripId: string, todoId: string) => `/v1/trips/${tripId}/todos/${todoId}`,
  },
} as const;