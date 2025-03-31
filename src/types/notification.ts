import { z } from 'zod';

// Notification types
export const NotificationType = z.enum([
  'TRIP_INVITE',
  'TRIP_UPDATE',
  'TRIP_STATUS',
  'TODO_CREATED',
  'TODO_UPDATED',
  'TODO_COMPLETED',
  'MEMBER_ADDED',
  'MEMBER_REMOVED',
  'MEMBER_ROLE_UPDATED',
  'WEATHER_UPDATED',
  'WEATHER_ALERT',
  'CHAT_MESSAGE',
  'CHAT_REACTION',
  'LOCATION_UPDATED',
  'SYSTEM'
]);

export type NotificationType = z.infer<typeof NotificationType>;

// Notification status
export const NotificationStatus = z.enum([
  'pending',
  'accepted',
  'declined',
  'read',
  'unread'
]);

export type NotificationStatus = z.infer<typeof NotificationStatus>;

// Trip invite notification
export interface TripInviteNotification {
  id: string;
  type: 'TRIP_INVITE';
  inviteId: string;
  tripId: string;
  inviterName: string;
  message?: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'declined';
  isRead: boolean;
}

// Trip update notification
export interface TripUpdateNotification {
  id: string;
  type: 'TRIP_UPDATE' | 'TRIP_STATUS';
  tripId: string;
  tripName: string;
  updaterName: string;
  updateType: 'details' | 'dates' | 'location' | 'status';
  timestamp: string;
  isRead: boolean;
  data: {
    oldValue?: string;
    newValue?: string;
    statusChange?: {
      from: string;
      to: string;
    };
  };
}

// Todo notification
export interface TodoNotification {
  id: string;
  type: 'TODO_CREATED' | 'TODO_UPDATED' | 'TODO_COMPLETED';
  tripId: string;
  todoId: string;
  todoText: string;
  creatorName: string;
  timestamp: string;
  isRead: boolean;
  data?: {
    assignedToName?: string;
    completedByName?: string;
  };
}

// Member notification
export interface MemberNotification {
  id: string;
  type: 'MEMBER_ADDED' | 'MEMBER_REMOVED' | 'MEMBER_ROLE_UPDATED';
  tripId: string;
  tripName: string;
  memberName: string;
  timestamp: string;
  isRead: boolean;
  data?: {
    role?: string;
    previousRole?: string;
    actorName?: string;
  };
}

// Weather notification
export interface WeatherNotification {
  id: string;
  type: 'WEATHER_UPDATED' | 'WEATHER_ALERT';
  tripId: string;
  tripLocation: string;
  timestamp: string;
  isRead: boolean;
  data: {
    weatherCode?: number;
    temperature?: number;
    alertType?: string;
    alertSeverity?: 'info' | 'warning' | 'severe' | 'extreme';
    alertMessage?: string;
  };
}

// Chat notification
export interface ChatNotification {
  id: string;
  type: 'CHAT_MESSAGE' | 'CHAT_REACTION';
  tripId: string;
  chatId: string;
  senderName: string;
  timestamp: string;
  isRead: boolean;
  data: {
    messageId: string;
    messagePreview?: string;
    reactionType?: string;
  };
}

// Location notification
export interface LocationNotification {
  id: string;
  type: 'LOCATION_UPDATED';
  tripId: string;
  memberName: string;
  timestamp: string;
  isRead: boolean;
  data: {
    location: {
      latitude: number;
      longitude: number;
    };
    locationName?: string;
  };
}

// Generic notification for other types
export interface GenericNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  data?: Record<string, any>;
}

// Union type for all notifications
export type Notification = 
  | TripInviteNotification 
  | TripUpdateNotification
  | TodoNotification
  | MemberNotification
  | WeatherNotification
  | ChatNotification
  | LocationNotification
  | GenericNotification;

// Helper type guards for each notification type
export const isTripInviteNotification = (
  notification: Notification
): notification is TripInviteNotification => {
  return notification.type === 'TRIP_INVITE';
};

export const isTripUpdateNotification = (
  notification: Notification
): notification is TripUpdateNotification => {
  return notification.type === 'TRIP_UPDATE' || notification.type === 'TRIP_STATUS';
};

export const isTodoNotification = (
  notification: Notification
): notification is TodoNotification => {
  return notification.type === 'TODO_CREATED' || 
         notification.type === 'TODO_UPDATED' || 
         notification.type === 'TODO_COMPLETED';
};

export const isMemberNotification = (
  notification: Notification
): notification is MemberNotification => {
  return notification.type === 'MEMBER_ADDED' || 
         notification.type === 'MEMBER_REMOVED' || 
         notification.type === 'MEMBER_ROLE_UPDATED';
};

export const isWeatherNotification = (
  notification: Notification
): notification is WeatherNotification => {
  return notification.type === 'WEATHER_UPDATED' || notification.type === 'WEATHER_ALERT';
};

export const isChatNotification = (
  notification: Notification
): notification is ChatNotification => {
  return notification.type === 'CHAT_MESSAGE' || notification.type === 'CHAT_REACTION';
};

export const isLocationNotification = (
  notification: Notification
): notification is LocationNotification => {
  return notification.type === 'LOCATION_UPDATED';
};

// Schema for trip invite from WebSocket
export const TripInviteEventSchema = z.object({
  event: z.literal('TRIP_INVITE'),
  data: z.object({
    inviteId: z.string(),
    tripId: z.string(),
    inviterName: z.string(),
    message: z.string().optional(),
    timestamp: z.string(),
    status: z.string().default('pending')
  })
});

export type TripInviteEvent = z.infer<typeof TripInviteEventSchema>;

// Type guard for trip invite events
export const isTripInviteEvent = (data: unknown): data is TripInviteEvent => {
  return TripInviteEventSchema.safeParse(data).success;
}; 