import { z } from 'zod';

// Notification types
export const NotificationType = z.enum([
  'TRIP_INVITE',
  'TRIP_UPDATE',
  'CHAT_MESSAGE',
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
export type Notification = TripInviteNotification | GenericNotification;

// Helper to check if notification is a trip invite
export const isTripInviteNotification = (
  notification: Notification
): notification is TripInviteNotification => {
  return notification.type === 'TRIP_INVITE';
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