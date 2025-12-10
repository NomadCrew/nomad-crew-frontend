import { z } from 'zod';

// --- Base Components ---

// Using zod for runtime validation of incoming WS data
const NotificationIdSchema = z.string().uuid(); // Assuming backend uses UUIDs
const IsoTimestampSchema = z.string().datetime({ offset: true }); // Expect ISO 8601 format

// Define schemas for specific metadata structures
// Backend sends camelCase with ID suffix (invitationID, tripID, inviterID)
const TripInvitationMetadataSchema = z.object({
  invitationID: z.string(),
  tripID: z.string(),
  tripName: z.string(),
  inviterName: z.string(),
  inviterID: z.string(),
});

const ChatMessageMetadataSchema = z.object({
  chatID: z.string(),
  messageID: z.string(),
  senderName: z.string(),
  messagePreview: z.string(),
});

const MemberAddedMetadataSchema = z.object({
  tripID: z.string(),
  tripName: z.string(),
  addedUserID: z.string(),
  addedUserName: z.string(),
  adderUserID: z.string(),
  adderUserName: z.string(),
});

// TripUpdateMetadata - backend sends ID suffix for IDs
const TripUpdateMetadataSchema = z.object({
  tripID: z.string(),
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
// Note: Backend may send TRIP_INVITATION_RECEIVED for new invitations
const NotificationTypeEnum = z.enum([
  'TRIP_INVITATION',
  'TRIP_INVITATION_RECEIVED', // Backend sends this type
  'CHAT_MESSAGE',
  'MEMBER_ADDED',
  'TRIP_UPDATE',
  'UNKNOWN', // Added for fallback case
]);

// --- Zod Schema for Discriminated Union (for WebSocket Validation) ---
// Define individual schemas for each notification type extending the base

export const ZodNotificationSchema = z.discriminatedUnion('type', [
  NotificationBaseSchema.extend({
    type: z.literal('TRIP_INVITATION'),
    metadata: TripInvitationMetadataSchema,
  }),
  // Backend sends TRIP_INVITATION_RECEIVED for new trip invitations
  NotificationBaseSchema.extend({
    type: z.literal('TRIP_INVITATION_RECEIVED'),
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
    type: z.literal('TRIP_UPDATE'),
    metadata: TripUpdateMetadataSchema,
  }),
  // Fallback for generic/unknown types
  NotificationBaseSchema.extend({
    type: z.literal('UNKNOWN'),
    metadata: z.record(z.unknown()), // Allows any metadata shape
  }),
]);

// Infer the TypeScript type from the Zod schema
// This becomes the primary Notification type for the application
export type Notification = z.infer<typeof ZodNotificationSchema>;

// --- Specific TypeScript Types (Derived from Zod Schema) ---
// We can still export specific types if needed for clarity or type guards

// Trip invitation can come as either TRIP_INVITATION or TRIP_INVITATION_RECEIVED from backend
export type TripInvitationNotification = Extract<
  Notification,
  { type: 'TRIP_INVITATION' | 'TRIP_INVITATION_RECEIVED' }
>;
export type ChatMessageNotification = Extract<Notification, { type: 'CHAT_MESSAGE' }>;
export type MemberAddedNotification = Extract<Notification, { type: 'MEMBER_ADDED' }>;
export type TripUpdateNotification = Extract<Notification, { type: 'TRIP_UPDATE' }>;
export type GenericNotification = Extract<Notification, { type: 'UNKNOWN' }>;

// --- Type Guards (Using Zod refine or simple checks) ---

export const isTripInvitationNotification = (
  notification: Notification
): notification is TripInvitationNotification => {
  // Backend may send either TRIP_INVITATION or TRIP_INVITATION_RECEIVED
  return (
    notification.type === 'TRIP_INVITATION' || notification.type === 'TRIP_INVITATION_RECEIVED'
  );
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
