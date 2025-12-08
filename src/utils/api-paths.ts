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
    register: createApiPath('auth/register'),
    refresh: createApiPath('auth/refresh'),
    logout: createApiPath('auth/logout'),
    validate: createApiPath('auth/validate'),
  },
  users: {
    create: createApiPath('users'),
    me: createApiPath('users/me'),
    byId: (id: string) => createApiPath(`users/${id}`),
    onboard: createApiPath('users/onboard'),
  },
  trips: {
    list: createApiPath('trips'),
    create: createApiPath('trips'),
    byId: (id: string) => createApiPath(`trips/${id}`),
    updateStatus: (id: string) => createApiPath(`trips/${id}/status`),
    ws: (id: string) => createApiPath(`trips/${id}/ws`),
    invite: (tripId: string) => createApiPath(`trips/${tripId}/invitations`),
    invitations: (tripId: string) => createApiPath(`trips/${tripId}/invitations`),
    acceptInvitation: createApiPath('trips/invitations/accept'),
    declineInvitation: createApiPath('invitations/decline'),
    invitationDetails: createApiPath('invitations/details'),
    messages: (tripId: string) => createApiPath(`trips/${tripId}/chat/messages`),
    messagesRead: (tripId: string) => createApiPath(`trips/${tripId}/chat/messages/read`),
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
    UPDATE_LAST_READ: (tripId: string) => createApiPath(`trips/${tripId}/chat/messages/read`),
  },
} as const;
