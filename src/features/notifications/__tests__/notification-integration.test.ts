import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNotificationStore } from '../store/useNotificationStore';
import { notificationService } from '../service';
import { parseNotification } from '../types/notification';

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

describe('Notification Integration Tests', () => {
  beforeEach(() => {
    // Clear store before each test
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      latestChatMessageToast: null,
      latestLocationUpdate: null,
    });
  });

  describe('parseNotification', () => {
    it('should parse valid TRIP_UPDATE notification', () => {
      const rawNotification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TRIP_UPDATE',
        priority: 'HIGH',
        data: {
          tripId: 'trip-123',
          tripName: 'Summer Vacation',
          updateType: 'trip_created',
          updatedBy: 'John Doe',
        },
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const parsed = parseNotification(rawNotification);
      expect(parsed).toBeTruthy();
      expect(parsed?.type).toBe('TRIP_UPDATE');
      expect(parsed?.priority).toBe('HIGH');
      expect(parsed?.data.tripId).toBe('trip-123');
    });

    it('should parse valid CHAT_MESSAGE notification', () => {
      const rawNotification = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        type: 'CHAT_MESSAGE',
        priority: 'MEDIUM',
        data: {
          tripId: 'trip-123',
          tripName: 'Summer Vacation',
          chatId: 'chat-456',
          senderId: 'user-789',
          senderName: 'Jane Doe',
          messagePreview: 'Hey everyone, excited for the trip!',
        },
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const parsed = parseNotification(rawNotification);
      expect(parsed).toBeTruthy();
      expect(parsed?.type).toBe('CHAT_MESSAGE');
      expect(parsed?.data.messagePreview).toBe('Hey everyone, excited for the trip!');
    });

    it('should parse valid LOCATION_UPDATE notification', () => {
      const rawNotification = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        type: 'LOCATION_UPDATE',
        priority: 'LOW',
        data: {
          tripId: 'trip-123',
          tripName: 'Summer Vacation',
          sharedById: 'user-456',
          sharedByName: 'Bob Smith',
          location: {
            lat: 37.7749,
            lng: -122.4194,
            name: 'San Francisco',
          },
        },
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const parsed = parseNotification(rawNotification);
      expect(parsed).toBeTruthy();
      expect(parsed?.type).toBe('LOCATION_UPDATE');
      expect(parsed?.data.location?.lat).toBe(37.7749);
    });

    it('should return null for invalid notification', () => {
      const invalidNotification = {
        id: 'not-a-uuid',
        type: 'INVALID_TYPE',
        data: {},
      };

      const parsed = parseNotification(invalidNotification);
      expect(parsed).toBeNull();
    });
  });

  describe('useNotificationStore', () => {
    it('should handle incoming TRIP_UPDATE notification', () => {
      const { result } = renderHook(() => useNotificationStore());

      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TRIP_UPDATE' as const,
        priority: 'HIGH' as const,
        data: {
          tripId: 'trip-123',
          tripName: 'Summer Vacation',
          updateType: 'trip_created' as const,
          updatedBy: 'John Doe',
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

      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        type: 'CHAT_MESSAGE' as const,
        priority: 'MEDIUM' as const,
        data: {
          tripId: 'trip-123',
          tripName: 'Summer Vacation',
          chatId: 'chat-456',
          senderId: 'user-789',
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

    it('should handle incoming LOCATION_UPDATE notification', () => {
      const { result } = renderHook(() => useNotificationStore());

      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        type: 'LOCATION_UPDATE' as const,
        priority: 'LOW' as const,
        data: {
          tripId: 'trip-123',
          tripName: 'Summer Vacation',
          sharedById: 'user-456',
          sharedByName: 'Bob Smith',
          location: {
            lat: 37.7749,
            lng: -122.4194,
            name: 'San Francisco',
          },
        },
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.handleIncomingNotification(notification);
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.latestLocationUpdate).toEqual(notification);
      expect(result.current.unreadCount).toBe(1);
    });

    it('should not increment unread count for read notifications', () => {
      const { result } = renderHook(() => useNotificationStore());

      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TRIP_UPDATE' as const,
        priority: 'HIGH' as const,
        data: {
          tripId: 'trip-123',
          tripName: 'Summer Vacation',
          updateType: 'trip_created' as const,
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

      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TRIP_UPDATE' as const,
        priority: 'HIGH' as const,
        data: {
          tripId: 'trip-123',
          tripName: 'Summer Vacation',
          updateType: 'trip_created' as const,
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

      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TRIP_UPDATE' as const,
        priority: 'HIGH' as const,
        data: {
          tripId: 'trip-123',
          tripName: 'Summer Vacation',
          updateType: 'member_added' as const,
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
      mockApi.post = jest.fn().mockResolvedValue({ data: {} });

      // Accept invitation
      await act(async () => {
        await result.current.handleTripUpdateAction(notification, 'accept');
      });

      expect(mockApi.post).toHaveBeenCalledWith('/v1/trips/trip-123/members/accept');
      expect(result.current.notifications[0].read).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });
  });
});