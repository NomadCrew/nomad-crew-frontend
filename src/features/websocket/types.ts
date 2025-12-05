import { z } from 'zod';

// Connection Status
export const WebSocketStatus = z.enum([
  'CONNECTING',
  'CONNECTED',
  'DISCONNECTED',
  'ERROR'
]);

export type WebSocketStatus = z.infer<typeof WebSocketStatus>;

// Re-export types from the global events file
// In the future, we might want to move more event-related types here
export {
  ServerEvent,
  ServerEventType,
  BaseEventSchema,
  isServerEvent,
  isLocationEvent,
  isChatEvent,
  isTodoEvent,
  isTripEvent,
  isWeatherEvent,
  isMemberEvent,
  isMemberInviteEvent,
  isTripInviteEvent
} from '../../types/events'; 