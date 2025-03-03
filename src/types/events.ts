import { z } from 'zod';

// Core event types
export const ServerEventType = z.enum([
  'TRIP_CREATED',
  'TRIP_UPDATED',
  'TRIP_DELETED',
  'TRIP_STARTED',
  'TRIP_ENDED',
  'TRIP_STATUS_UPDATED',
  'TODO_CREATED',
  'TODO_UPDATED',
  'TODO_DELETED',
  'TODO_COMPLETED',
  'WEATHER_UPDATED',
  'WEATHER_ALERT',
  'MEMBER_ADDED',
  'MEMBER_ROLE_UPDATED',
  'MEMBER_REMOVED',
  'MEMBER_INVITED',
  'LOCATION_UPDATED',
  'LOCATION_SHARING_CHANGED',
  // New chat event types
  'CHAT_MESSAGE_SENT',
  'CHAT_MESSAGE_EDITED',
  'CHAT_MESSAGE_DELETED',
  'CHAT_REACTION_ADDED',
  'CHAT_REACTION_REMOVED',
  'CHAT_READ_RECEIPT',
  'CHAT_TYPING_STATUS'
]);

export type ServerEventType = z.infer<typeof ServerEventType>;

// Connection Status
export const WebSocketStatus = z.enum([
  'CONNECTING',
  'CONNECTED',
  'DISCONNECTED',
  'ERROR'
]);

export type WebSocketStatus = z.infer<typeof WebSocketStatus>;

// Metadata schema
export const EventMetadataSchema = z.object({
  correlationID: z.string().optional(),
  causationID: z.string().optional(),
  source: z.string(),
  tags: z.record(z.string()).optional()
});

// Base event schema
export const BaseEventSchema = z.object({
  id: z.string(),
  type: ServerEventType,
  tripId: z.string(),
  userId: z.string().optional(),
  timestamp: z.string().datetime(),
  version: z.number(),
  metadata: z.object({
    correlationId: z.string().optional(),
    causationId: z.string().optional(),
    source: z.string(),
    tags: z.record(z.string()).optional()
  }),
  payload: z.unknown()
});

export type ServerEvent = z.infer<typeof BaseEventSchema>;

// Event schemas for validation
export const EventSchemas = {
  connection_ack: BaseEventSchema.extend({
    type: z.literal('connection_ack'),
    payload: z.object({
      sessionId: z.string()
    })
  }),

  trip_updated: BaseEventSchema.extend({
    type: z.literal('TRIP_UPDATED'),
    payload: z.object({
      id: z.string(),
      name: z.string(),
      status: z.string(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      location: z.string().optional(),
      description: z.string().optional()
    })
  }),

  weather_update: BaseEventSchema.extend({
    type: z.literal('WEATHER_UPDATED'),
    payload: z.object({
      tripId: z.string(),
      temperature_2m: z.number(),
      weather_code: z.number(),
      hourly_forecast: z.array(
        z.object({
          timestamp: z.string().datetime(),
          temperature_2m: z.number(),
          weather_code: z.number(),
          precipitation: z.number()
        })
      ),
      timestamp: z.string().datetime()
    })
  }),

  todo: BaseEventSchema.extend({
    type: z.enum(['TODO_CREATED', 'TODO_UPDATED', 'TODO_DELETED', 'TODO_COMPLETED']),
    payload: z.object({
      id: z.string(),
      text: z.string(),
      status: z.enum(['INCOMPLETE', 'COMPLETED']),
      createdAt: z.string().datetime(),
      completedAt: z.string().datetime().optional(),
      createdBy: z.string(),
      assignedTo: z.string().optional()
    })
  }),

  error: BaseEventSchema.extend({
    type: z.literal('error'),
    payload: z.object({
      code: z.number(),
      message: z.string(),
      details: z.record(z.unknown()).optional()
    })
  }),

  member: BaseEventSchema.extend({
    type: z.enum(['MEMBER_ADDED', 'MEMBER_ROLE_UPDATED', 'MEMBER_REMOVED', 'MEMBER_INVITED']),
    payload: z.object({
      userId: z.string().optional(),
      inviteeEmail: z.string().email().optional(),
      role: z.string().optional(),
      previousRole: z.string().optional(),
      invitationToken: z.string().optional(),
      expiresAt: z.string().datetime().optional()
    })
  }),

  memberInvite: BaseEventSchema.extend({
    type: z.literal('MEMBER_INVITED'),
    payload: z.object({
      inviteeEmail: z.string().email(),
      invitationToken: z.string(),
      expiresAt: z.string().datetime()
    })
  }),

  location: BaseEventSchema.extend({
    type: z.enum(['LOCATION_UPDATED', 'LOCATION_SHARING_CHANGED']),
    payload: z.object({
      userId: z.string(),
      name: z.string().optional(),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        accuracy: z.number().optional(),
        timestamp: z.number()
      }),
      isSharingEnabled: z.boolean().optional()
    })
  }),

  // Chat event schemas
  chatMessage: BaseEventSchema.extend({
    type: z.enum(['CHAT_MESSAGE_SENT', 'CHAT_MESSAGE_EDITED', 'CHAT_MESSAGE_DELETED']),
    payload: z.object({
      messageId: z.string(),
      groupId: z.string(),
      content: z.string().optional(),
      user: z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string().optional()
      }),
      timestamp: z.string().datetime()
    })
  }),

  chatReaction: BaseEventSchema.extend({
    type: z.enum(['CHAT_REACTION_ADDED', 'CHAT_REACTION_REMOVED']),
    payload: z.object({
      messageId: z.string(),
      groupId: z.string(),
      reaction: z.string(),
      user: z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string().optional()
      })
    })
  }),

  chatReadReceipt: BaseEventSchema.extend({
    type: z.literal('CHAT_READ_RECEIPT'),
    payload: z.object({
      groupId: z.string(),
      messageId: z.string(),
      user: z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string().optional()
      })
    })
  })
};

// Type guards
export const isServerEvent = (event: unknown): event is ServerEvent => {
  return BaseEventSchema.safeParse(event).success;
};

export const isTripEvent = (event: ServerEvent): event is z.infer<typeof EventSchemas.trip_updated> => {
  return event.type === 'TRIP_UPDATED' && EventSchemas.trip_updated.safeParse(event).success;
};

export const isWeatherEvent = (event: ServerEvent): event is z.infer<typeof EventSchemas.weather_update> => {
  return event.type === 'WEATHER_UPDATED' && EventSchemas.weather_update.safeParse(event).success;
};

export const isTodoEvent = (event: ServerEvent): event is z.infer<typeof EventSchemas.todo> => {
  return ['TODO_CREATED', 'TODO_UPDATED', 'TODO_DELETED'].includes(event.type) && 
    EventSchemas.todo.safeParse(event).success;
};

export const isMemberInviteEvent = (event: ServerEvent): event is z.infer<typeof EventSchemas.memberInvite> =>
  EventSchemas.memberInvite.safeParse(event).success;

export const isMemberEvent = (event: ServerEvent): event is z.infer<typeof EventSchemas.member> =>
  ['MEMBER_ADDED', 'MEMBER_ROLE_UPDATED', 'MEMBER_REMOVED'].includes(event.type) &&
  EventSchemas.member.safeParse(event).success;

export const isLocationEvent = (event: ServerEvent): event is z.infer<typeof EventSchemas.location> =>
  ['LOCATION_UPDATED', 'LOCATION_SHARING_CHANGED'].includes(event.type) &&
  EventSchemas.location.safeParse(event).success;

// Chat event type guard
export const isChatEvent = (event: ServerEvent): boolean => {
  return [
    'CHAT_MESSAGE_SENT',
    'CHAT_MESSAGE_EDITED',
    'CHAT_MESSAGE_DELETED',
    'CHAT_REACTION_ADDED',
    'CHAT_REACTION_REMOVED',
    'CHAT_READ_RECEIPT'
  ].includes(event.type);
};