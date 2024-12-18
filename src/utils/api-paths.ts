// src/utils/api-paths.ts
import { API_CONFIG } from '@/src/api/env';

export const createApiPath = (path: string) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/${API_CONFIG.VERSION}/${cleanPath}`;
};

// Define all API endpoints
export const API_PATHS = {
  auth: {
    login: createApiPath('auth/login'),
    logout: createApiPath('auth/logout'),
    refresh: createApiPath('auth/refresh'),
    validate: createApiPath('auth/validate'),
  },
  users: {
    create: createApiPath('users'),
    me: createApiPath('users/me'),
    byId: (id: number) => createApiPath(`users/${id}`),
  },
  trips: {
    list: createApiPath('trips/list'),
    create: createApiPath('trips'),
    byId: (id: number) => createApiPath(`trips/${id}`),
  },
} as const;