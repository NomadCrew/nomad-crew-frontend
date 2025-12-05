import { z } from 'zod';

// --- Base Components ---

// Using zod for runtime validation of incoming notification data
const NotificationIdSchema = z.string().uuid(); // Assuming backend uses UUIDs
const IsoTimestampSchema = z.string().datetime({ offset: true }); // Expect ISO 8601 format

// Define schemas for specific metadata structures
const TripInvitationMetadataSchema = z.object({
  inviteId: z.string(),
  tripId: z.string(),
  tripName: z.string(),
  inviterName: z.string(),
});

const ChatMessageMetadataSchema = z.object({
  chatId: z.string(),
  messageId: z.string(),
  senderName: z.string(),
  messagePreview: z.string(),
});

const MemberAddedMetadataSchema = z.object({
  tripId: z.string(),
  tripName: z.string(),
  addedUserId: z.string(),
  addedUserName: z.string(),
  adderUserId: z.string(),
  adderUserName: z.string(),
});

// Example for TripUpdateMetadata (adjust as needed)
const TripUpdateMetadataSchema = z.object({
  tripId: z.string(),
  tripName: z.string(),
  updaterName: z.string(),
  changedFields: z.array(z.string()),
});

// Base schema for any notification - use this for parsing WS messages
const NotificationBaseSchema = z.object({
  id: NotificationIdSchema,
  message: z.string(),
  read: z.boolean(),
  createdAt: IsoTimestampSchema,
});

// Define known notification types as a Zod enum
const NotificationTypeEnum = z.enum([
  'TRIP_INVITATION',
  'CHAT_MESSAGE',
  'MEMBER_ADDED',
  'TRIP_UPDATE',
  'UNKNOWN' // Added for fallback case
]);

// --- Zod Schema for Discriminated Union (for Notification Validation) ---
// Define individual schemas for each notification type extending the base

export const ZodNotificationSchema = z.discriminatedUnion('type', [
  NotificationBaseSchema.extend({
    type: z.literal('TRIP_INVITATION'),
    metadata: TripInvitationMetadataSchema,
  }),
  NotificationBaseSchema.extend({
    type: z.literal('CHAT_MESSAGE'),
    metadata: ChatMessageMetadataSchema,
  }),
  NotificationBaseSchema.extend({
    type: z.literal('MEMBER_ADDED'),
    metadata: MemberAddedMetadataSchema,
  }),
  NotificationBaseSchema.extend({
    type: z.literal('TRIP_UPDATE'), // Example
    metadata: TripUpdateMetadataSchema,
  }),
  // Fallback for generic/unknown types
  NotificationBaseSchema.extend({
    type: z.literal('UNKNOWN'), // Changed from z.string() to z.literal('UNKNOWN')
    metadata: z.record(z.unknown()), // Allows any metadata shape
  }),
]);

// Infer the TypeScript type from the Zod schema
// This becomes the primary Notification type for the application
export type Notification = z.infer<typeof ZodNotificationSchema>;

// --- Specific TypeScript Types (Derived from Zod Schema) ---
// We can still export specific types if needed for clarity or type guards

export type TripInvitationNotification = Extract<Notification, { type: 'TRIP_INVITATION' }>;
export type ChatMessageNotification = Extract<Notification, { type: 'CHAT_MESSAGE' }>;
export type MemberAddedNotification = Extract<Notification, { type: 'MEMBER_ADDED' }>;
export type TripUpdateNotification = Extract<Notification, { type: 'TRIP_UPDATE' }>;
export type GenericNotification = Extract<Notification, { type: 'UNKNOWN' }>; // Updated to match the literal

// --- Type Guards (Using Zod refine or simple checks) ---

export const isTripInvitationNotification = (
  notification: Notification
): notification is TripInvitationNotification => {
  // Zod schema validation is preferred at the entry point
  // but simple type guards can still be useful internally.
  return notification.type === 'TRIP_INVITATION';
};

export const isChatMessageNotification = (
  notification: Notification
): notification is ChatMessageNotification => {
  return notification.type === 'CHAT_MESSAGE';
};

export const isMemberAddedNotification = (
  notification: Notification
): notification is MemberAddedNotification => {
  return notification.type === 'MEMBER_ADDED';
};

export const isTripUpdateNotification = (
 notification: Notification
): notification is TripUpdateNotification => {
 return notification.type === 'TRIP_UPDATE';
};

export const isGenericNotification = (
 notification: Notification
): notification is GenericNotification => {
 return notification.type === 'UNKNOWN';
};

// --- API Payloads --- (Keep as is)
export interface MarkNotificationsReadPayload {
  status: 'read';
}

// --- Cleanup / Remove Duplicates --- 
// Remove the old NotificationType enum, NotificationStatus enum, 
// old individual interfaces, old union type, old type guards, 
// and the TripInviteEventSchema/guard as they are now superseded by ZodNotificationSchema. 

export const NotificationDataSchema = z.object({
  // ... existing fields ...
});

// Example usage if needed for reference (though Supabase will handle events differently)
// export const ParsedNotificationEventSchema = BaseEventSchema.extend({
// ... existing code ...
// }); 