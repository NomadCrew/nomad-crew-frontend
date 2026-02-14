import {
  isServerEvent,
  isTripEvent,
  isWeatherEvent,
  isTodoEvent,
  isMemberEvent,
  isMemberInviteEvent,
  isLocationEvent,
  isChatEvent,
  isPollEvent,
  isTripInviteEvent,
  BaseEventSchema,
  ServerEventType,
} from '@/src/types/events';
import type { ServerEvent } from '@/src/types/events';

// Helper to build a valid base event
function createBaseEvent(overrides: Partial<ServerEvent> = {}): ServerEvent {
  return {
    id: 'evt-1',
    type: 'TRIP_UPDATED',
    tripId: 'trip-123',
    timestamp: new Date().toISOString(),
    version: 1,
    metadata: {
      source: 'test',
    },
    payload: {},
    ...overrides,
  } as ServerEvent;
}

describe('Event type guards', () => {
  describe('isServerEvent', () => {
    it('returns true for a valid base event', () => {
      const event = createBaseEvent();
      expect(isServerEvent(event)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isServerEvent(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isServerEvent(undefined)).toBe(false);
    });

    it('returns false for a plain string', () => {
      expect(isServerEvent('hello')).toBe(false);
    });

    it('returns false for an object missing required fields', () => {
      expect(isServerEvent({ type: 'TRIP_UPDATED' })).toBe(false);
    });

    it('returns false for an event with invalid type', () => {
      const event = createBaseEvent({ type: 'INVALID_TYPE' as any });
      expect(isServerEvent(event)).toBe(false);
    });
  });

  describe('isPollEvent', () => {
    it('returns true for POLL_CREATED event', () => {
      const event = createBaseEvent({ type: 'POLL_CREATED' as any });
      expect(isPollEvent(event)).toBe(true);
    });

    it('returns true for POLL_UPDATED event', () => {
      const event = createBaseEvent({ type: 'POLL_UPDATED' as any });
      expect(isPollEvent(event)).toBe(true);
    });

    it('returns true for POLL_VOTE_CAST event', () => {
      const event = createBaseEvent({ type: 'POLL_VOTE_CAST' as any });
      expect(isPollEvent(event)).toBe(true);
    });

    it('returns true for POLL_VOTE_REMOVED event', () => {
      const event = createBaseEvent({ type: 'POLL_VOTE_REMOVED' as any });
      expect(isPollEvent(event)).toBe(true);
    });

    it('returns true for POLL_CLOSED event', () => {
      const event = createBaseEvent({ type: 'POLL_CLOSED' as any });
      expect(isPollEvent(event)).toBe(true);
    });

    it('returns true for POLL_DELETED event', () => {
      const event = createBaseEvent({ type: 'POLL_DELETED' as any });
      expect(isPollEvent(event)).toBe(true);
    });

    it('returns false for TRIP_UPDATED event', () => {
      const event = createBaseEvent({ type: 'TRIP_UPDATED' as any });
      expect(isPollEvent(event)).toBe(false);
    });

    it('returns false for CHAT_MESSAGE_SENT event', () => {
      const event = createBaseEvent({ type: 'CHAT_MESSAGE_SENT' as any });
      expect(isPollEvent(event)).toBe(false);
    });
  });

  describe('isChatEvent', () => {
    it('returns true for CHAT_MESSAGE_SENT', () => {
      const event = createBaseEvent({ type: 'CHAT_MESSAGE_SENT' as any });
      expect(isChatEvent(event)).toBe(true);
    });

    it('returns true for CHAT_MESSAGE_EDITED', () => {
      const event = createBaseEvent({ type: 'CHAT_MESSAGE_EDITED' as any });
      expect(isChatEvent(event)).toBe(true);
    });

    it('returns true for CHAT_MESSAGE_DELETED', () => {
      const event = createBaseEvent({ type: 'CHAT_MESSAGE_DELETED' as any });
      expect(isChatEvent(event)).toBe(true);
    });

    it('returns true for CHAT_REACTION_ADDED', () => {
      const event = createBaseEvent({ type: 'CHAT_REACTION_ADDED' as any });
      expect(isChatEvent(event)).toBe(true);
    });

    it('returns true for CHAT_REACTION_REMOVED', () => {
      const event = createBaseEvent({ type: 'CHAT_REACTION_REMOVED' as any });
      expect(isChatEvent(event)).toBe(true);
    });

    it('returns true for CHAT_READ_RECEIPT', () => {
      const event = createBaseEvent({ type: 'CHAT_READ_RECEIPT' as any });
      expect(isChatEvent(event)).toBe(true);
    });

    it('returns false for POLL_CREATED', () => {
      const event = createBaseEvent({ type: 'POLL_CREATED' as any });
      expect(isChatEvent(event)).toBe(false);
    });

    it('returns false for TRIP_UPDATED', () => {
      const event = createBaseEvent({ type: 'TRIP_UPDATED' as any });
      expect(isChatEvent(event)).toBe(false);
    });
  });

  describe('isTripEvent', () => {
    it('returns true for valid TRIP_UPDATED event with correct payload', () => {
      const event = createBaseEvent({
        type: 'TRIP_UPDATED' as any,
        payload: {
          id: 'trip-1',
          name: 'Test Trip',
          status: 'ACTIVE',
        },
      });
      expect(isTripEvent(event)).toBe(true);
    });

    it('returns false for non-trip event types', () => {
      const event = createBaseEvent({ type: 'POLL_CREATED' as any });
      expect(isTripEvent(event)).toBe(false);
    });
  });

  describe('isTodoEvent', () => {
    it('returns true for TODO_CREATED with valid payload', () => {
      const event = createBaseEvent({
        type: 'TODO_CREATED' as any,
        payload: {
          id: 'todo-1',
          text: 'Pack bags',
          status: 'INCOMPLETE',
          createdAt: new Date().toISOString(),
          createdBy: 'user-1',
        },
      });
      expect(isTodoEvent(event)).toBe(true);
    });

    it('returns false for non-todo event types', () => {
      const event = createBaseEvent({ type: 'TRIP_UPDATED' as any });
      expect(isTodoEvent(event)).toBe(false);
    });
  });

  describe('isMemberEvent', () => {
    it('returns true for MEMBER_ADDED with valid payload', () => {
      const event = createBaseEvent({
        type: 'MEMBER_ADDED' as any,
        payload: {
          userId: 'user-1',
          role: 'member',
        },
      });
      expect(isMemberEvent(event)).toBe(true);
    });

    it('returns false for non-member event types', () => {
      const event = createBaseEvent({ type: 'POLL_CREATED' as any });
      expect(isMemberEvent(event)).toBe(false);
    });
  });

  describe('isLocationEvent', () => {
    it('returns true for LOCATION_UPDATED with valid payload', () => {
      const event = createBaseEvent({
        type: 'LOCATION_UPDATED' as any,
        payload: {
          userId: 'user-1',
          location: {
            latitude: 48.8566,
            longitude: 2.3522,
            timestamp: Date.now(),
          },
        },
      });
      expect(isLocationEvent(event)).toBe(true);
    });

    it('returns false for non-location event types', () => {
      const event = createBaseEvent({ type: 'TRIP_UPDATED' as any });
      expect(isLocationEvent(event)).toBe(false);
    });
  });

  describe('isTripInviteEvent', () => {
    it('returns true for valid TRIP_INVITE event', () => {
      const event = createBaseEvent({
        type: 'TRIP_INVITE' as any,
        payload: {
          inviteId: 'inv-1',
          tripId: 'trip-1',
          inviterName: 'John',
          timestamp: new Date().toISOString(),
          status: 'pending',
        },
      });
      expect(isTripInviteEvent(event)).toBe(true);
    });

    it('returns false for non-invite event types', () => {
      const event = createBaseEvent({ type: 'TRIP_UPDATED' as any });
      expect(isTripInviteEvent(event)).toBe(false);
    });
  });

  describe('ServerEventType enum', () => {
    it('includes all poll event types', () => {
      const pollTypes = [
        'POLL_CREATED',
        'POLL_UPDATED',
        'POLL_VOTE_CAST',
        'POLL_VOTE_REMOVED',
        'POLL_CLOSED',
        'POLL_DELETED',
      ];

      pollTypes.forEach((type) => {
        expect(ServerEventType.safeParse(type).success).toBe(true);
      });
    });

    it('includes all chat event types', () => {
      const chatTypes = [
        'CHAT_MESSAGE_SENT',
        'CHAT_MESSAGE_EDITED',
        'CHAT_MESSAGE_DELETED',
        'CHAT_REACTION_ADDED',
        'CHAT_REACTION_REMOVED',
        'CHAT_READ_RECEIPT',
        'CHAT_TYPING_STATUS',
      ];

      chatTypes.forEach((type) => {
        expect(ServerEventType.safeParse(type).success).toBe(true);
      });
    });

    it('rejects invalid event types', () => {
      expect(ServerEventType.safeParse('INVALID_TYPE').success).toBe(false);
      expect(ServerEventType.safeParse('').success).toBe(false);
      expect(ServerEventType.safeParse(123).success).toBe(false);
    });
  });

  describe('BaseEventSchema', () => {
    it('validates a well-formed event', () => {
      const event = {
        id: 'evt-1',
        type: 'POLL_CREATED',
        tripId: 'trip-1',
        timestamp: new Date().toISOString(),
        version: 1,
        metadata: {
          source: 'api',
        },
        payload: { pollId: 'poll-1' },
      };

      expect(BaseEventSchema.safeParse(event).success).toBe(true);
    });

    it('rejects event missing id', () => {
      const event = {
        type: 'POLL_CREATED',
        tripId: 'trip-1',
        timestamp: new Date().toISOString(),
        version: 1,
        metadata: { source: 'api' },
        payload: {},
      };

      expect(BaseEventSchema.safeParse(event).success).toBe(false);
    });

    it('rejects event missing metadata.source', () => {
      const event = {
        id: 'evt-1',
        type: 'POLL_CREATED',
        tripId: 'trip-1',
        timestamp: new Date().toISOString(),
        version: 1,
        metadata: {},
        payload: {},
      };

      expect(BaseEventSchema.safeParse(event).success).toBe(false);
    });

    it('accepts event with optional metadata fields', () => {
      const event = {
        id: 'evt-1',
        type: 'POLL_CREATED',
        tripId: 'trip-1',
        timestamp: new Date().toISOString(),
        version: 1,
        metadata: {
          source: 'api',
          correlationId: 'corr-1',
          causationId: 'cause-1',
          tags: { env: 'test' },
        },
        payload: {},
      };

      expect(BaseEventSchema.safeParse(event).success).toBe(true);
    });
  });

  describe('Poll event schema validation', () => {
    it('validates a POLL_CREATED event with poll-specific payload', () => {
      const { EventSchemas } = require('@/src/types/events');
      const event = {
        id: 'evt-1',
        type: 'POLL_CREATED',
        tripId: 'trip-1',
        timestamp: new Date().toISOString(),
        version: 1,
        metadata: { source: 'api' },
        payload: {
          pollId: 'poll-1',
          tripId: 'trip-1',
          question: 'Where to eat?',
        },
      };

      expect(EventSchemas.poll.safeParse(event).success).toBe(true);
    });

    it('validates a POLL_VOTE_CAST event with optionId', () => {
      const { EventSchemas } = require('@/src/types/events');
      const event = {
        id: 'evt-2',
        type: 'POLL_VOTE_CAST',
        tripId: 'trip-1',
        timestamp: new Date().toISOString(),
        version: 1,
        metadata: { source: 'api' },
        payload: {
          pollId: 'poll-1',
          tripId: 'trip-1',
          optionId: 'opt-1',
          userId: 'user-1',
        },
      };

      expect(EventSchemas.poll.safeParse(event).success).toBe(true);
    });

    it('validates a POLL_CLOSED event with closedBy', () => {
      const { EventSchemas } = require('@/src/types/events');
      const event = {
        id: 'evt-3',
        type: 'POLL_CLOSED',
        tripId: 'trip-1',
        timestamp: new Date().toISOString(),
        version: 1,
        metadata: { source: 'api' },
        payload: {
          pollId: 'poll-1',
          tripId: 'trip-1',
          closedBy: 'user-1',
        },
      };

      expect(EventSchemas.poll.safeParse(event).success).toBe(true);
    });

    it('rejects a poll event with non-poll type', () => {
      const { EventSchemas } = require('@/src/types/events');
      const event = {
        id: 'evt-4',
        type: 'TRIP_UPDATED',
        tripId: 'trip-1',
        timestamp: new Date().toISOString(),
        version: 1,
        metadata: { source: 'api' },
        payload: {
          pollId: 'poll-1',
          tripId: 'trip-1',
        },
      };

      expect(EventSchemas.poll.safeParse(event).success).toBe(false);
    });
  });
});
