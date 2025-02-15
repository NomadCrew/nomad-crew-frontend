import { z } from 'zod';

// Core event types
export const ServerEventType = z.enum([
  'connection_ack',
  'trip_updated',
  'WEATHER_UPDATED',
  'member_joined',
  'member_left',
  'todo_created',
  'todo_updated',
  'todo_deleted',
  'error'
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
  id: z.string().uuid(),
  type: ServerEventType,
  tripId: z.string(),
  userId: z.string(),
  timestamp: z.string().datetime(),
  version: z.number().default(1),
  metadata: EventMetadataSchema,
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
    type: z.literal('trip_updated'),
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
    type: z.enum(['todo_created', 'todo_updated', 'todo_deleted']),
    payload: z.object({
      id: z.string(),
      tripId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      status: z.enum(['pending', 'in_progress', 'completed']),
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
  })
};

// Type guards
export const isServerEvent = (event: unknown): event is ServerEvent => {
  return BaseEventSchema.safeParse(event).success;
};

export const isTripEvent = (event: ServerEvent): event is z.infer<typeof EventSchemas.trip_updated> => {
  return event.type === 'trip_updated' && EventSchemas.trip_updated.safeParse(event).success;
};

export const isWeatherEvent = (event: ServerEvent): event is z.infer<typeof EventSchemas.weather_update> => {
  return event.type === 'WEATHER_UPDATED' && EventSchemas.weather_update.safeParse(event).success;
};

export const isTodoEvent = (event: ServerEvent): event is z.infer<typeof EventSchemas.todo> => {
  return ['todo_created', 'todo_updated', 'todo_deleted'].includes(event.type) && 
    EventSchemas.todo.safeParse(event).success;
};