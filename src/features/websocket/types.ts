import { z } from 'zod';

/**
 * WebSocket connection status
 */
export type WebSocketStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

/**
 * Server event types for location updates
 */
export const LocationEventTypes = [
  'LOCATION_UPDATED',
  'LOCATION_SHARING_CHANGED',
] as const;

/**
 * Server event types for chat functionality
 */
export const ChatEventTypes = [
  'CHAT_MESSAGE_SENT',
  'CHAT_MESSAGE_SEND',
  'CHAT_MESSAGE_EDITED',
  'CHAT_MESSAGE_DELETED',
  'CHAT_REACTION_ADDED',
  'CHAT_REACTION_REMOVED',
  'CHAT_READ_RECEIPT',
  'CHAT_TYPING_STATUS',
  'MESSAGE_SENT',
  'MESSAGE_EDITED',
  'MESSAGE_DELETED',
  'REACTION_ADDED',
  'REACTION_REMOVED',
  'TYPING_STATUS',
] as const;

/**
 * All server event types
 */
export const ServerEventTypes = [
  ...LocationEventTypes,
  ...ChatEventTypes,
  'TRIP_UPDATED',
  'TRIP_MEMBER_JOINED',
  'TRIP_MEMBER_LEFT',
  'TRIP_MEMBER_UPDATED',
  'NOTIFICATION',
] as const;

export type ServerEventType = (typeof ServerEventTypes)[number];
export type LocationEventType = (typeof LocationEventTypes)[number];
export type ChatEventType = (typeof ChatEventTypes)[number];

/**
 * Base server event structure
 */
export interface ServerEvent {
  id?: string;
  type: string;
  tripId?: string;
  userId?: string;
  timestamp?: string;
  payload?: Record<string, unknown>;
}

/**
 * Zod schema for validating base server events
 */
export const BaseEventSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  tripId: z.string().optional(),
  userId: z.string().optional(),
  timestamp: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
});

/**
 * Type guard to check if an object is a valid ServerEvent
 */
export function isServerEvent(data: unknown): data is ServerEvent {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const event = data as Record<string, unknown>;
  return typeof event.type === 'string';
}

/**
 * Type guard to check if an event is a location-related event
 */
export function isLocationEvent(event: ServerEvent): boolean {
  return LocationEventTypes.includes(event.type as LocationEventType);
}

/**
 * Type guard to check if an event is a chat-related event
 */
export function isChatEvent(event: ServerEvent): boolean {
  return ChatEventTypes.includes(event.type as ChatEventType);
}
