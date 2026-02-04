import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNotificationStore } from '../store/useNotificationStore';
import { notificationService } from '../service';
import {
  safeParseNotification,
  Notification,
  TripInvitationNotification,
} from '../types/notification';

// Mock API client
jest.mock('@/src/api/api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  apiClient: {},
}));

// Mock Supabase
jest.mock('@/src/api/supabase', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    })),
    removeChannel: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock auth store
jest.mock('@/src/features/auth/store', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      user: { id: 'test-user-id' },
    })),
    subscribe: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Notification Integration Tests', () => {
  beforeEach(() => {
    // Clear store before each test
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      latestChatMessageToast: null,
      isFetching: false,
      isFetchingUnreadCount: false,
      isMarkingRead: false,
      isHandlingAction: false,
      error: null,
      offset: 0,
      hasMore: true,
      hasHydrated: true,
    });
    jest.clearAllMocks();
  });

  describe('safeParseNotification', () => {
    it('should parse valid TRIP_UPDATE notification', () => {
      const rawNotification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TRIP_UPDATE',
        message: 'Trip was updated',
        metadata: {
          tripID: 'trip-123',
          tripName: 'Summer Vacation',
          updaterName: 'John Doe',
          changedFields: ['name', 'description'],
        },
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const parsed = safeParseNotification(rawNotification);
      expect(parsed).toBeTruthy();
      expect(parsed?.type).toBe('TRIP_UPDATE');
      expect(parsed?.message).toBe('Trip was updated');
      if (parsed?.type === 'TRIP_UPDATE') {
        expect(parsed.metadata.tripID).toBe('trip-123');
      }
    });

    it('should parse valid CHAT_MESSAGE notification', () => {
      const rawNotification = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        type: 'CHAT_MESSAGE',
        message: 'New message from Jane',
        metadata: {
          chatID: 'chat-456',
          messageID: 'msg-789',
          senderName: 'Jane Doe',
          messagePreview: 'Hey everyone, excited for the trip!',
        },
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const parsed = safeParseNotification(rawNotification);
      expect(parsed).toBeTruthy();
      expect(parsed?.type).toBe('CHAT_MESSAGE');
      if (parsed?.type === 'CHAT_MESSAGE') {
        expect(parsed.metadata.messagePreview).toBe('Hey everyone, excited for the trip!');
      }
    });

    it('should parse valid TRIP_INVITATION notification', () => {
      const rawNotification = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        type: 'TRIP_INVITATION',
        message: 'You have been invited to Summer Vacation',
        metadata: {
          invitationID: 'inv-123',
          tripID: 'trip-123',
          tripName: 'Summer Vacation',
          inviterName: 'Bob Smith',
          inviterID: 'user-456',
        },
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const parsed = safeParseNotification(rawNotification);
      expect(parsed).toBeTruthy();
      expect(parsed?.type).toBe('TRIP_INVITATION');
      if (parsed?.type === 'TRIP_INVITATION') {
        expect(parsed.metadata.tripName).toBe('Summer Vacation');
      }
    });

    it('should return UNKNOWN type for unknown notification types', () => {
      const unknownNotification = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        type: 'SOME_NEW_TYPE',
        message: 'Some message',
        metadata: { foo: 'bar' },
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const parsed = safeParseNotification(unknownNotification);
      expect(parsed).toBeTruthy();
      expect(parsed?.type).toBe('UNKNOWN');
    });

    it('should return null for completely invalid notification', () => {
      const invalidNotification = {
        // Missing required fields
        someField: 'value',
      };

      const parsed = safeParseNotification(invalidNotification);
      expect(parsed).toBeNull();
    });
  });

  describe('useNotificationStore', () => {
    it('should handle incoming TRIP_UPDATE notification', () => {
      const { result } = renderHook(() => useNotificationStore());

      const notification: Notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TRIP_UPDATE',
        message: 'Trip was updated',
        metadata: {
          tripID: 'trip-123',
          tripName: 'Summer Vacation',
          updaterName: 'John Doe',
          changedFields: ['name'],
        },
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.handleIncomingNotification(notification);
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toEqual(notification);
      expect(result.current.unreadCount).toBe(1);
    });

    it('should handle incoming CHAT_MESSAGE notification', () => {
      const { result } = renderHook(() => useNotificationStore());

      const notification: Notification = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        type: 'CHAT_MESSAGE',
        message: 'New message from Jane',
        metadata: {
          chatID: 'chat-456',
          messageID: 'msg-789',
          senderName: 'Jane Doe',
          messagePreview: 'Hey everyone!',
        },
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.handleIncomingNotification(notification);
      });

      // Chat messages should set toast but not be added to notifications list
      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.latestChatMessageToast).toEqual(notification);
      expect(result.current.unreadCount).toBe(1);
    });

    it('should handle incoming TRIP_INVITATION notification', () => {
      const { result } = renderHook(() => useNotificationStore());

      const notification: Notification = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        type: 'TRIP_INVITATION',
        message: 'You have been invited',
        metadata: {
          invitationID: 'inv-123',
          tripID: 'trip-123',
          tripName: 'Summer Vacation',
          inviterName: 'Bob Smith',
          inviterID: 'user-456',
        },
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.handleIncomingNotification(notification);
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.unreadCount).toBe(1);
    });

    it('should not increment unread count for read notifications', () => {
      const { result } = renderHook(() => useNotificationStore());

      const notification: Notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TRIP_UPDATE',
        message: 'Trip was updated',
        metadata: {
          tripID: 'trip-123',
          tripName: 'Summer Vacation',
          updaterName: 'John Doe',
          changedFields: ['name'],
        },
        read: true, // Already read
        createdAt: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.handleIncomingNotification(notification);
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.unreadCount).toBe(0); // Should not increment
    });

    it('should prevent duplicate notifications', () => {
      const { result } = renderHook(() => useNotificationStore());

      const notification: Notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TRIP_UPDATE',
        message: 'Trip was updated',
        metadata: {
          tripID: 'trip-123',
          tripName: 'Summer Vacation',
          updaterName: 'John Doe',
          changedFields: ['name'],
        },
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.handleIncomingNotification(notification);
        result.current.handleIncomingNotification(notification); // Duplicate
      });

      expect(result.current.notifications).toHaveLength(1); // Should not add duplicate
      expect(result.current.unreadCount).toBe(1);
    });
  });

  describe('Notification Actions', () => {
    it('should handle trip invitation acceptance', async () => {
      const { result } = renderHook(() => useNotificationStore());

      const notification: TripInvitationNotification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TRIP_INVITATION',
        message: 'You have been invited to Summer Vacation',
        metadata: {
          invitationID: 'inv-123',
          tripID: 'trip-123',
          tripName: 'Summer Vacation',
          inviterName: 'Bob Smith',
          inviterID: 'user-456',
        },
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      // Add notification first
      act(() => {
        result.current.handleIncomingNotification(notification);
      });

      // Mock API response
      const mockApi = require('@/src/api/api-client').api;
      mockApi.post.mockResolvedValue({ data: {} });

      // Accept invitation
      await act(async () => {
        await result.current.acceptTripInvitation(notification);
      });

      expect(mockApi.post).toHaveBeenCalledWith('/v1/invitations/inv-123/accept');
      expect(result.current.notifications[0].read).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should handle trip invitation decline', async () => {
      const { result } = renderHook(() => useNotificationStore());

      const notification: TripInvitationNotification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TRIP_INVITATION',
        message: 'You have been invited to Summer Vacation',
        metadata: {
          invitationID: 'inv-123',
          tripID: 'trip-123',
          tripName: 'Summer Vacation',
          inviterName: 'Bob Smith',
          inviterID: 'user-456',
        },
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      // Add notification first
      act(() => {
        result.current.handleIncomingNotification(notification);
      });

      expect(result.current.notifications).toHaveLength(1);

      // Mock API response
      const mockApi = require('@/src/api/api-client').api;
      mockApi.post.mockResolvedValue({ data: {} });

      // Decline invitation
      await act(async () => {
        await result.current.declineTripInvitation(notification);
      });

      expect(mockApi.post).toHaveBeenCalledWith('/v1/invitations/inv-123/decline');
      // Notification should be removed after declining
      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });
  });
});
