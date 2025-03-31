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
    register: createApiPath('auth/register'),
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
    updateStatus: (id: string) => createApiPath(`trips/${id}/status`),
    ws: (id: string) => createApiPath(`trips/${id}/ws`),
    invite: (tripId: string) => createApiPath(`trips/${tripId}/invitations`),
    invitations: (tripId: string) => createApiPath(`trips/${tripId}/invitations`),
    acceptInvitation: createApiPath('trips/invitations/accept'),
    messages: (tripId: string) => createApiPath(`trips/${tripId}/messages`),
    messagesRead: (tripId: string) => createApiPath(`trips/${tripId}/messages/read`),
  },
  todos: {
    create: (tripId: string) => createApiPath(`trips/${tripId}/todos`),
    delete: (tripId: string, todoID: string) => createApiPath(`trips/${tripId}/todos/${todoID}`),
    list: (tripId: string) => createApiPath(`trips/${tripId}/todos`),
    update: (tripId: string, todoID: string) => createApiPath(`trips/${tripId}/todos/${todoID}`),
  },
  // Add location endpoints
  location: {
    update: createApiPath('location/update'),
    byTrip: (tripId: string) => createApiPath(`trips/${tripId}/locations`),
    preferences: createApiPath('location/preferences'),
  },
  // Add chat endpoints
  CHAT: {
    UPDATE_LAST_READ: (tripId: string) => createApiPath(`trips/${tripId}/messages/read`),
  }
} as const;