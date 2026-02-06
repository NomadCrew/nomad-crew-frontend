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
    search: createApiPath('users/search'),
    updateContactEmail: createApiPath('users/me/contact-email'),
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
    declineInvitation: createApiPath('trips/invitations/decline'),
    invitationDetails: createApiPath('trips/invitations/details'),
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
    update: (tripId: string) => createApiPath(`trips/${tripId}/locations`),
    byTrip: (tripId: string) => createApiPath(`trips/${tripId}/locations`),
    preferences: createApiPath('location/preferences'),
    members: (tripId: string) => createApiPath(`trips/${tripId}/locations/members`),
  },
  // Add chat endpoints
  CHAT: {
    UPDATE_LAST_READ: (tripId: string) => createApiPath(`trips/${tripId}/chat/messages/read`),
  },
  // Push notification endpoints
  pushTokens: {
    register: createApiPath('users/push-token'),
    deregister: createApiPath('users/push-token'),
    deregisterAll: createApiPath('users/push-tokens'),
  },
  // Notification endpoints
  notifications: {
    list: createApiPath('notifications'),
    markRead: (id: string) => createApiPath(`notifications/${id}/read`),
    markAllRead: createApiPath('notifications/read-all'),
    delete: (id: string) => createApiPath(`notifications/${id}`),
    deleteAll: createApiPath('notifications'),
  },
  // Invitation endpoints (ID-based, used by notification store)
  invitations: {
    accept: (id: string) => createApiPath(`invitations/${id}/accept`),
    decline: (id: string) => createApiPath(`invitations/${id}/decline`),
  },
  // Chat reaction endpoints
  reactions: {
    list: (tripId: string, messageId: string) =>
      createApiPath(`trips/${tripId}/chat/messages/${messageId}/reactions`),
    add: (tripId: string, messageId: string) =>
      createApiPath(`trips/${tripId}/chat/messages/${messageId}/reactions`),
    remove: (tripId: string, messageId: string, reactionType: string) =>
      createApiPath(`trips/${tripId}/chat/messages/${messageId}/reactions/${reactionType}`),
  },
  // Read receipt endpoints
  readReceipts: {
    updateLastRead: (tripId: string) => createApiPath(`trips/${tripId}/chat/last-read`),
  },
} as const;
