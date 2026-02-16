import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Notification,
  TripInvitationNotification,
  ChatMessageNotification,
  MarkNotificationsReadPayload,
  isChatMessageNotification,
  isTripInvitationNotification,
} from '../types/notification';
import { ServerEvent } from '@/src/types/events';
import { apiClient, api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { logger } from '@/src/utils/logger';
import { registerStoreReset } from '@/src/utils/store-reset';

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
  actionInProgress: Set<string>; // Set of notification IDs currently being acted upon
  isClearingAll: boolean;
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
  deleteNotification: (notificationId: string) => Promise<void>;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        notifications: [],
        unreadCount: 0,
        hasHydrated: false,
        latestChatMessageToast: null,
        isFetching: false,
        isFetchingUnreadCount: false,
        isMarkingRead: false,
        actionInProgress: new Set<string>(),
        isClearingAll: false,
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
            const response = await api.get<{ count: number }>(API_PATHS.notifications.unreadCount);
            set({ unreadCount: response.data.count });
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

          // Only block if already fetching, or if trying to load more when there's no more
          if (isFetching || (options.loadMore && !hasMore)) {
            return;
          }

          set({ isFetching: true, error: null });
          // On fresh fetch (not loadMore), reset offset to 0
          const currentOffset = options.loadMore ? offset : 0;

          try {
            const response = await api.get<Notification[]>(API_PATHS.notifications.list, {
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
          if (!notification || notification.read || get().isMarkingRead) return;

          set({ isMarkingRead: true, error: null });
          try {
            // Use the correct endpoint for marking a single notification as read
            await api.patch(API_PATHS.notifications.markRead(notificationId));

            set((state) => ({
              notifications: state.notifications.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
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

        // A6: On error, re-fetch notifications instead of leaving stale optimistic updates
        markAllNotificationsRead: async () => {
          if (get().isMarkingRead || get().unreadCount === 0) return;
          set({ isMarkingRead: true, error: null });
          try {
            // Use the correct endpoint for marking all notifications as read
            await api.patch(API_PATHS.notifications.markAllRead);

            set((state) => ({
              notifications: state.notifications.map((n) => ({ ...n, read: true })),
              unreadCount: 0,
            }));
          } catch (err: any) {
            const errorMessage =
              err.response?.data?.message ||
              err.message ||
              'Failed to mark all notifications as read';
            logger.error('markAllNotificationsRead failed:', err);
            // Re-fetch to recover from stale optimistic state
            get().fetchNotifications();
            get().fetchUnreadCount();
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
          // A4: Do NOT increment unreadCount for CHAT_MESSAGE — they are transient toasts
          if (isChatMessageNotification(notification)) {
            set({
              latestChatMessageToast: notification,
            });
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
            };
          });
        },

        // A3: Per-notification action tracking via actionInProgress Set
        acceptTripInvitation: async (notification: TripInvitationNotification) => {
          const notificationId = notification.id;
          if (get().actionInProgress.has(notificationId)) return;
          if (!isTripInvitationNotification(notification)) {
            logger.warn('acceptTripInvitation called with non-invite notification:', notification);
            return;
          }

          set((state) => ({
            actionInProgress: new Set(state.actionInProgress).add(notificationId),
            error: null,
          }));
          const invitationId = notification.metadata.invitationID;

          try {
            // POST to the backend's business logic endpoint for accepting
            await api.post(API_PATHS.invitations.accept(invitationId));

            logger.info(`Accepted trip invitation: ${invitationId}`);

            // A5: Remove the notification from the list after successful accept
            set((state) => ({
              notifications: state.notifications.filter((n) => n.id !== notificationId),
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
            set((state) => {
              const next = new Set(state.actionInProgress);
              next.delete(notificationId);
              return { actionInProgress: next };
            });
          }
        },

        declineTripInvitation: async (notification: TripInvitationNotification) => {
          const notificationId = notification.id;
          if (get().actionInProgress.has(notificationId)) return;
          if (!isTripInvitationNotification(notification)) {
            logger.warn('declineTripInvitation called with non-invite notification:', notification);
            return;
          }

          set((state) => ({
            actionInProgress: new Set(state.actionInProgress).add(notificationId),
            error: null,
          }));
          const invitationId = notification.metadata.invitationID;

          try {
            await api.post(API_PATHS.invitations.decline(invitationId));
            logger.info(`Declined trip invitation: ${invitationId}`);

            set((state) => ({
              notifications: state.notifications.filter((n) => n.id !== notificationId),
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
            set((state) => {
              const next = new Set(state.actionInProgress);
              next.delete(notificationId);
              return { actionInProgress: next };
            });
          }
        },

        clearChatToast: () => {
          set({ latestChatMessageToast: null });
        },

        // Delete all notifications from server and clear local state
        clearNotifications: async () => {
          if (get().isClearingAll) return;
          set({ isClearingAll: true, error: null });
          try {
            // Call backend to delete all notifications
            const response = await api.delete<{ deleted_count: number }>(
              API_PATHS.notifications.deleteAll
            );
            logger.info(`Deleted ${response.data.deleted_count} notifications from server`);

            // Clear from Zustand state
            set({
              notifications: [],
              unreadCount: 0,
              latestChatMessageToast: null,
              offset: 0,
              hasMore: true, // Reset pagination
            });

            // Clear from AsyncStorage
            await AsyncStorage.removeItem(STORAGE_KEY);
            logger.info('All notifications cleared from state and storage.');
          } catch (err: any) {
            const errorMessage =
              err.response?.data?.message || err.message || 'Failed to clear notifications';
            set({ error: errorMessage });
            logger.error('clearNotifications failed:', err);
          } finally {
            set({ isClearingAll: false });
          }
        },

        // Delete a single notification via API
        deleteNotification: async (notificationId: string) => {
          const notification = get().notifications.find((n) => n.id === notificationId);
          if (!notification) return;
          if (get().actionInProgress.has(notificationId)) return;

          set((state) => ({
            actionInProgress: new Set(state.actionInProgress).add(notificationId),
            error: null,
          }));
          try {
            await api.delete(API_PATHS.notifications.delete(notificationId));

            set((state) => ({
              notifications: state.notifications.filter((n) => n.id !== notificationId),
              // Decrement unread count if the deleted notification was unread
              unreadCount: !notification.read
                ? Math.max(0, state.unreadCount - 1)
                : state.unreadCount,
            }));

            logger.info('Notification deleted:', notificationId);
          } catch (err: any) {
            const errorMessage =
              err.response?.data?.message || err.message || 'Failed to delete notification';
            set({ error: errorMessage });
            logger.error('deleteNotification failed:', err);
          } finally {
            set((state) => {
              const next = new Set(state.actionInProgress);
              next.delete(notificationId);
              return { actionInProgress: next };
            });
          }
        },

        reset: () => {
          // Clear AsyncStorage persistence
          AsyncStorage.removeItem(STORAGE_KEY).catch((error) => {
            logger.error(
              'NotificationStore',
              'Failed to clear notification AsyncStorage on reset:',
              error
            );
          });

          set({
            notifications: [],
            unreadCount: 0,
            latestChatMessageToast: null,
            isFetching: false,
            isFetchingUnreadCount: false,
            isMarkingRead: false,
            actionInProgress: new Set<string>(),
            isClearingAll: false,
            error: null,
            offset: 0,
            hasMore: true,
          });
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
              }, 500);
            }
          };
        },
      }
    ),
    { name: 'NotificationStore' }
  )
);

registerStoreReset('NotificationStore', () => useNotificationStore.getState().reset());

/**
 * Selector to get the latest unread chat message notification for toast display.
 */
export const selectLatestChatMessageToast = (state: NotificationState) =>
  state.latestChatMessageToast;

/**
 * Helper to check if a specific notification has an action in progress.
 */
export const isNotificationActionInProgress = (notificationId: string): boolean => {
  return useNotificationStore.getState().actionInProgress.has(notificationId);
};

/**
 * Selector-style helper for use in components (returns a function for use with useNotificationStore).
 */
export const selectIsNotificationActionInProgress =
  (notificationId: string) => (state: NotificationState) =>
    state.actionInProgress.has(notificationId);

/**
 * Helper function to handle incoming server events that might contain notifications.
 * This can be called from a real-time event manager or similar event source.
 */
export const handleIncomingServerEventForNotifications = (event: ServerEvent) => {
  // For now, we're not handling generic server events as notifications
  // Notifications will come through a dedicated notification channel
  // This function can be extended when we add notification-specific event types
  logger.debug('Server event received, but not converted to notification:', event.type);
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
export const selectActionInProgress = (state: NotificationState) => state.actionInProgress;
export const selectIsClearingAll = (state: NotificationState) => state.isClearingAll;
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
  deleteNotification: state.deleteNotification,
});

// Composite selectors (for common combinations)
export const selectNotificationsWithStatus = (state: NotificationState) => ({
  notifications: state.notifications,
  unreadCount: state.unreadCount,
  isFetching: state.isFetching,
  hasMore: state.hasMore,
  error: state.error,
});
