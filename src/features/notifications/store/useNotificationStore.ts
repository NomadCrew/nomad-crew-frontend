import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Notification,
  NotificationBase,
  TripInvitationNotification,
  ChatMessageNotification,
  MarkNotificationsReadPayload,
  isChatMessageNotification,
  isTripInvitationNotification,
} from '../types/notification';
import { ServerEvent } from '@/src/types/events';
import { apiClient, api } from '@/src/api/api-client';
import { logger } from '@/src/utils/logger';

const NOTIFICATION_LIMIT = 100; // Max notifications to keep in state/storage
const API_PAGE_LIMIT = 20; // How many notifications to fetch per API call
const STORAGE_KEY = '@nomad_crew_notifications_v2'; // Use new key due to structure change

interface NotificationState {
  // Data
  notifications: Notification[];
  unreadCount: number;
  hasHydrated: boolean; // To track store hydration from AsyncStorage
  latestChatMessageToast: ChatMessageNotification | null; // For transient toast display

  // Loading and error states
  isFetching: boolean;
  isFetchingUnreadCount: boolean;
  isMarkingRead: boolean;
  isHandlingAction: boolean; // e.g., accepting/declining invites
  error: string | null;

  // Pagination
  offset: number;
  hasMore: boolean;

  // Actions
  fetchUnreadCount: () => Promise<void>;
  fetchNotifications: (options?: { loadMore?: boolean }) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  handleIncomingNotification: (notification: Notification) => void;
  acceptTripInvitation: (notification: TripInvitationNotification) => Promise<void>;
  declineTripInvitation: (notification: TripInvitationNotification) => Promise<void>;
  clearChatToast: () => void;
  setHasHydrated: (state: boolean) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      hasHydrated: false,
      latestChatMessageToast: null,
      isFetching: false,
      isFetchingUnreadCount: false,
      isMarkingRead: false,
      isHandlingAction: false,
      error: null,
      offset: 0,
      hasMore: true,

      setHasHydrated: (state) => {
        set({ hasHydrated: state });
      },

      fetchUnreadCount: async () => {
        if (get().isFetchingUnreadCount) return;
        set({ isFetchingUnreadCount: true, error: null });
        try {
          // Get all notifications with status=unread and use the response length as the count
          const response = await api.get<Notification[]>('/v1/notifications', {
            params: { status: 'unread' },
          });
          set({ unreadCount: response.data.length });
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message || err.message || 'Failed to fetch unread count';
          set({ error: errorMessage });
          logger.error('fetchUnreadCount failed:', err);
        } finally {
          set({ isFetchingUnreadCount: false });
        }
      },

      fetchNotifications: async (options = { loadMore: false }) => {
        const { isFetching, offset, hasMore } = get();
        const limit = API_PAGE_LIMIT;
        if (isFetching || (!options.loadMore && offset > 0) || (options.loadMore && !hasMore)) {
          return;
        }

        set({ isFetching: true, error: null });
        const currentOffset = options.loadMore ? offset : 0;

        try {
          const response = await api.get<Notification[]>('/v1/notifications', {
            params: { limit, offset: currentOffset },
          });
          const fetchedNotifications = response.data || [];

          set((state) => ({
            notifications: options.loadMore
              ? [...state.notifications, ...fetchedNotifications]
              : fetchedNotifications,
            offset: currentOffset + fetchedNotifications.length,
            hasMore: fetchedNotifications.length === limit,
          }));

          if (!options.loadMore) {
            get().fetchUnreadCount();
          }
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message || err.message || 'Failed to fetch notifications';
          set({ error: errorMessage });
          logger.error('fetchNotifications failed:', err);
        } finally {
          set({ isFetching: false });
        }
      },

      markNotificationRead: async (notificationId: string) => {
        const notification = get().notifications.find((n) => n.id === notificationId);
        if (!notification || notification.isRead || get().isMarkingRead) return;

        set({ isMarkingRead: true, error: null });
        try {
          // Use the correct endpoint for marking a single notification as read
          await api.patch(`/v1/notifications/${notificationId}/read`);

          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
          }));

          get().fetchUnreadCount();
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message || err.message || 'Failed to mark notification as read';
          set({ error: errorMessage });
          logger.error('markNotificationRead failed:', err);
        } finally {
          set({ isMarkingRead: false });
        }
      },

      markAllNotificationsRead: async () => {
        if (get().isMarkingRead || get().unreadCount === 0) return;
        set({ isMarkingRead: true, error: null });
        try {
          // Use the correct endpoint for marking all notifications as read
          await api.patch('/v1/notifications/read-all');

          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
          }));
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            'Failed to mark all notifications as read';
          get().fetchUnreadCount();
          logger.error('markAllNotificationsRead failed:', err);
        } finally {
          set({ isMarkingRead: false });
        }
      },

      handleIncomingNotification: (notification: Notification) => {
        // Ensure the notification object is valid (basic check)
        if (!notification || !notification.id || !notification.type) {
          logger.warn('Received invalid notification object via WebSocket', notification);
          return;
        }

        // Handle CHAT_MESSAGE specifically
        if (isChatMessageNotification(notification)) {
          set((state) => ({
            // Set the transient state for the toast component to pick up
            latestChatMessageToast: notification,
            // Increment count only if the backend marked it as unread
            // Or potentially if the chat screen for this message isn't active (requires more context)
            unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
          }));
          // Note: The UI component displaying the toast will be responsible for calling clearChatToast
          return; // Don't add chat messages to the persistent notification list
        }

        // Handle all other notification types
        set((state) => {
          // Prevent duplicates if the same notification arrives multiple times via WS
          if (state.notifications.some((n) => n.id === notification.id)) {
            logger.debug('Duplicate notification received via WS, ignoring:', notification.id);
            return state; // Return current state without modification
          }

          // Add the new notification to the beginning of the array
          const newNotifications = [notification, ...state.notifications];

          // Pruning Logic: Enforce the notification limit
          if (newNotifications.length > NOTIFICATION_LIMIT) {
            // Remove the oldest notification (the last element in the array)
            newNotifications.pop();
          }

          return {
            notifications: newNotifications,
            // Increment count only if the backend marked it as unread
            unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
            // Decide if receiving a notification should reset pagination/scroll
            // For now, let's not reset offset/hasMore automatically
          };
        });
      },

      acceptTripInvitation: async (notification: TripInvitationNotification) => {
        if (get().isHandlingAction) return;
        if (!isTripInvitationNotification(notification)) {
          logger.warn('acceptTripInvitation called with non-invite notification:', notification);
          return;
        }

        set({ isHandlingAction: true, error: null });
        const inviteId = notification.metadata.inviteId;

        try {
          // POST to the backend's business logic endpoint for accepting
          await api.post(`/v1/invitations/${inviteId}/accept`);

          // Success! We rely on the backend to potentially send a follow-up
          // WebSocket message (e.g., MEMBER_ADDED or TRIP_UPDATE) to reflect the change.
          // Alternatively, we could optimistically remove/update the notification here.
          // For now, just log success and potentially mark as read locally if desired.
          logger.info(`Accepted trip invitation: ${inviteId}`);

          // Optional: Mark as read locally after accepting
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notification.id ? { ...n, read: true } : n
            ),
            // Adjust unreadCount if it was unread
            unreadCount: !notification.read
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          }));
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message || err.message || 'Failed to accept trip invitation';
          set({ error: errorMessage });
          logger.error('acceptTripInvitation failed:', err);
        } finally {
          set({ isHandlingAction: false });
        }
      },

      declineTripInvitation: async (notification: TripInvitationNotification) => {
        if (get().isHandlingAction) return;
        if (!isTripInvitationNotification(notification)) {
          logger.warn('declineTripInvitation called with non-invite notification:', notification);
          return;
        }

        set({ isHandlingAction: true, error: null });
        const inviteId = notification.metadata.inviteId;

        try {
          await api.post(`/v1/invitations/${inviteId}/decline`);
          logger.info(`Declined trip invitation: ${inviteId}`);

          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notification.id
                ? { ...n, read: true, metadata: { ...n.metadata, status: 'declined' } }
                : n
            ),
            unreadCount: !notification.read
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          }));
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message || err.message || 'Failed to decline trip invitation';
          set({ error: errorMessage });
          logger.error('declineTripInvitation failed:', err);
        } finally {
          set({ isHandlingAction: false });
        }
      },

      clearChatToast: () => {
        set({ latestChatMessageToast: null });
      },

      // Ensure all notifications are cleared from Zustand and AsyncStorage
      clearNotifications: async () => {
        try {
          // Clear from Zustand state
          set({
            notifications: [],
            unreadCount: 0,
            latestChatMessageToast: null,
            isFetching: false,
            isFetchingUnreadCount: false,
            isMarkingRead: false,
            isHandlingAction: false,
            error: null,
            offset: 0,
            hasMore: true, // Reset pagination
          });
          // Clear from AsyncStorage
          await AsyncStorage.removeItem(STORAGE_KEY);
          logger.info('All notifications cleared from state and storage.');
        } catch (error) {
          logger.error('Error clearing notifications:', error);
          set({ error: 'Failed to clear notifications from storage.' });
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist a subset of the state
      partialize: (state) => ({
        notifications: state.notifications.slice(0, NOTIFICATION_LIMIT), // Persist only limited notifications
        // Do NOT persist unreadCount, fetch on load
        // Do NOT persist loading/error states
        // Do NOT persist latestChatMessageToast (it's transient)
        // Do NOT persist offset/hasMore (re-evaluate on load)
      }),
      onRehydrateStorage: (state) => {
        logger.info('Notification store rehydrated from AsyncStorage');
        return (draft, error) => {
          if (error) {
            logger.error('An error occurred during notification store rehydration:', error);
          }
          if (draft) {
            draft.setHasHydrated(true);
            // Fetch latest unread count after rehydration
            // Delay slightly to allow initial app setup
            setTimeout(() => {
              draft.fetchUnreadCount();
              // Potentially fetch initial notifications if the list is empty, or rely on user action.
              // For now, we won't auto-fetch list on rehydrate to save API calls, user can pull-to-refresh.
            }, 500);
          }
        };
      },
      // Versioning can be added here if schema changes occur
      // version: 1,
      // migrate: (persistedState, version) => { ... }
    }
  )
);

/**
 * Selector to get the latest unread chat message notification for toast display.
 */
export const selectLatestChatMessageToast = (state: NotificationState) =>
  state.latestChatMessageToast;

/**
 * Helper function to handle incoming server events that might contain notifications.
 * This can be called from a WebSocket manager or similar event source.
 */
export const handleIncomingServerEventForNotifications = (event: ServerEvent) => {
  if (event.type === 'NOTIFICATION' && event.payload) {
    const notification = event.payload as Notification; // Assume payload is a Notification
    useNotificationStore.getState().handleIncomingNotification(notification);
  } else if (event.type === 'CHAT_MESSAGE_RECEIVED' && event.payload) {
    // Convert CHAT_MESSAGE_RECEIVED to a ChatMessageNotification structure if needed
    // This assumes your backend sends a specific structure for chat messages that maps to ChatMessageNotification
    // For now, assuming the event.payload is already in the correct ChatMessageNotification format or similar enough.
    // If not, a transformation function would be needed here.
    const chatNotification = event.payload as ChatMessageNotification; // This might need adjustment
    useNotificationStore.getState().handleIncomingNotification(chatNotification);
  }
};

// ====================
// SELECTORS
// ====================

/**
 * Selectors for efficient component re-renders.
 * Use these to select only the specific state needed by components.
 */

// Basic state selectors
export const selectNotifications = (state: NotificationState) => state.notifications;
export const selectUnreadCount = (state: NotificationState) => state.unreadCount;
export const selectHasHydrated = (state: NotificationState) => state.hasHydrated;

// Loading state selectors
export const selectIsFetching = (state: NotificationState) => state.isFetching;
export const selectIsFetchingUnreadCount = (state: NotificationState) =>
  state.isFetchingUnreadCount;
export const selectIsMarkingRead = (state: NotificationState) => state.isMarkingRead;
export const selectIsHandlingAction = (state: NotificationState) => state.isHandlingAction;
export const selectError = (state: NotificationState) => state.error;

// Pagination selectors
export const selectHasMore = (state: NotificationState) => state.hasMore;
export const selectOffset = (state: NotificationState) => state.offset;

// Derived selectors
export const selectUnreadNotifications = (state: NotificationState) =>
  state.notifications.filter((n) => !n.read);

export const selectReadNotifications = (state: NotificationState) =>
  state.notifications.filter((n) => n.read);

export const selectNotificationById = (id: string) => (state: NotificationState) =>
  state.notifications.find((n) => n.id === id);

export const selectNotificationsByType = (type: string) => (state: NotificationState) =>
  state.notifications.filter((n) => n.type === type);

export const selectTripInvitations = (state: NotificationState) =>
  state.notifications.filter(isTripInvitationNotification);

export const selectChatNotifications = (state: NotificationState) =>
  state.notifications.filter(isChatMessageNotification);

// Action selectors (for components that only need actions)
export const selectNotificationActions = (state: NotificationState) => ({
  fetchNotifications: state.fetchNotifications,
  fetchUnreadCount: state.fetchUnreadCount,
  markNotificationRead: state.markNotificationRead,
  markAllNotificationsRead: state.markAllNotificationsRead,
  acceptTripInvitation: state.acceptTripInvitation,
  declineTripInvitation: state.declineTripInvitation,
  clearChatToast: state.clearChatToast,
  clearNotifications: state.clearNotifications,
});

// Composite selectors (for common combinations)
export const selectNotificationsWithStatus = (state: NotificationState) => ({
  notifications: state.notifications,
  unreadCount: state.unreadCount,
  isFetching: state.isFetching,
  hasMore: state.hasMore,
  error: state.error,
});
