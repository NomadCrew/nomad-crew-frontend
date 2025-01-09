import { API_CONFIG } from '@/src/api/env';

export const createApiPath = (path: string) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/${API_CONFIG.VERSION}/${cleanPath}`;
};

// Define all API endpoints
export const API_PATHS = {
  auth: {
    login: '/login', // Maps to /login (unversioned)
    logout: createApiPath('auth/logout'), // No backend implementation yet
    refresh: createApiPath('auth/refresh'), // No backend implementation yet
    validate: createApiPath('auth/validate'), // No backend implementation yet
  },
  users: {
    create: createApiPath('users'), // Maps to /users (unversioned)
    me: createApiPath('users/me'), // No backend implementation yet
    byId: (id: string) => createApiPath(`users/${id}`), // Maps to /v1/users/:id
  },
  trips: {
    list: createApiPath('trips/list'), // Maps to /v1/trips/list
    create: createApiPath('trips'), // Maps to /v1/trips (POST)
    byId: (id: string) => createApiPath(`trips/${id}`), // Maps to /v1/trips/:id
    updateStatus: (id: string) => `/v1/trips/${id}/status` // Maps to /v1/trips/:id/status
  },
} as const;
