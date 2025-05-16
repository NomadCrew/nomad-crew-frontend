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
  isTripInvitationNotification
} from '../types/notification';
import { ServerEvent } from '../types/events';
import { apiClient } from '../api/api-client';
import { logger } from '../utils/logger';

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
          const response = await apiClient.get<{ count: number }>('/api/notifications/count?status=unread');
          set({ unreadCount: response.data.count });
        } catch (err: any) {
          const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch unread count';
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
          const response = await apiClient.get<Notification[]>('/api/notifications', {
            params: { limit, offset: currentOffset },
          });
          const fetchedNotifications = response.data || [];

          set(state => ({
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
          const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch notifications';
          set({ error: errorMessage });
          logger.error('fetchNotifications failed:', err);
        } finally {
           set({ isFetching: false });
        }
      },

      markNotificationRead: async (notificationId: string) => {
        const notification = get().notifications.find(n => n.id === notificationId);
        if (!notification || notification.isRead || get().isMarkingRead) return;

        set({ isMarkingRead: true, error: null });
        try {
          await apiClient.patch(`/api/notifications/${notificationId}`);

          set(state => ({
            notifications: state.notifications.map(n =>
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
          }));

          get().fetchUnreadCount();

        } catch (err: any) {
          const errorMessage = err.response?.data?.message || err.message || 'Failed to mark notification as read';
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
          const payload: MarkNotificationsReadPayload = { status: 'read' };
          await apiClient.patch('/api/notifications', payload);

          set(state => ({
            notifications: state.notifications.map(n => ({ ...n, isRead: true })),
            unreadCount: 0,
          }));
        } catch (err: any) {
          const errorMessage = err.response?.data?.message || err.message || 'Failed to mark all notifications as read';
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
          set(state => ({
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
        set(state => {
          // Prevent duplicates if the same notification arrives multiple times via WS
          if (state.notifications.some(n => n.id === notification.id)) {
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
          await apiClient.post(`/api/invitations/${inviteId}/accept`);

          // Success! We rely on the backend to potentially send a follow-up
          // WebSocket message (e.g., MEMBER_ADDED or TRIP_UPDATE) to reflect the change.
          // Alternatively, we could optimistically remove/update the notification here.
          // For now, just log success and potentially mark as read locally if desired.
          logger.info(`Accepted trip invitation: ${inviteId}`);

          // Optional: Mark as read locally after accepting
          set(state => ({
             notifications: state.notifications.map(n =>
               n.id === notification.id ? { ...n, read: true } : n
             ),
             // Adjust unreadCount if it was unread
             unreadCount: !notification.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          }));

        } catch (err: any) {
          const errorMessage = err.response?.data?.message || err.message || 'Failed to accept trip invitation';
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
          // POST to the backend's business logic endpoint for declining
          await apiClient.post(`/api/invitations/${inviteId}/decline`);

          // Success! Similar to accept, rely on backend for subsequent state updates via WS.
          logger.info(`Declined trip invitation: ${inviteId}`);

          // Optional: Remove the notification locally after declining
          set(state => ({
            notifications: state.notifications.filter(n => n.id !== notification.id),
            // Adjust unreadCount if it was unread
            unreadCount: !notification.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          }));

        } catch (err: any) {
          const errorMessage = err.response?.data?.message || err.message || 'Failed to decline trip invitation';
          set({ error: errorMessage });
          logger.error('declineTripInvitation failed:', err);
        } finally {
          set({ isHandlingAction: false });
        }
      },

      clearChatToast: () => {
        set({ latestChatMessageToast: null });
      },

      clearNotifications: () => {
        AsyncStorage.removeItem(STORAGE_KEY)
          .catch(err => logger.error('Failed to clear notifications', err));
        set({ notifications: [], unreadCount: 0, offset: 0, hasMore: true, error: null });
      }
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
      }),
      onRehydrateStorage: () => (state) => {
         if (state) {
            state.setHasHydrated(true);
            logger.info('Notification store rehydrated from AsyncStorage.');
         } else {
            logger.warn('Notification store rehydration resulted in null state.');
            useNotificationStore.setState({ hasHydrated: true });
         }
      },
    }
  )
);

// --- Post-Hydration Initial Data Fetching ---
// We use a flag to ensure this runs only once after hydration completes.
let hydrationCompleted = false;
const unsubscribe = useNotificationStore.subscribe((state) => {
  // Check if hydration is complete AND we haven't run this logic yet
  if (state.hasHydrated && !hydrationCompleted) {
    hydrationCompleted = true; // Mark as completed to prevent re-running
    logger.info('Notification store hydration complete. Fetching initial data...');

    // Use a microtask to delay execution slightly, ensuring the current state
    // update cycle finishes and we get the truly latest state after hydration.
    queueMicrotask(() => {
       const currentState = useNotificationStore.getState(); // Get latest state inside microtask

        // Fetch the accurate unread count from the server first
        currentState.fetchUnreadCount().then(() => {
          // After getting the count, fetch the first page of notifications
          // only if the persisted list is empty. Adjust this condition if needed
          // (e.g., fetch always, fetch if data is older than X).
          if (currentState.notifications.length === 0) {
             logger.info('No persisted notifications found, fetching first page.');
             currentState.fetchNotifications(); // Fetch initial page (offset 0)
          } else {
             logger.info(`Loaded ${currentState.notifications.length} notifications from storage.`);
             // If notifications were loaded, we might still want to refresh the count
             // based on potentially missed WS messages while offline.
             // fetchUnreadCount() already ran, so the count should be accurate.
          }
        }).catch(error => {
            logger.error('Error during post-hydration fetchUnreadCount:', error);
        });
    });

    // Optional: Unsubscribe after running once if we don't need to listen for further state changes here.
    // However, keeping it subscribed is harmless.
    // unsubscribe();
  }
});

// --- WebSocket Integration Hook (Example - Keep for reference) ---
/*
import React, { useEffect } from 'react';
import { useWebSocket } from './useWebSocket'; // Your WebSocket hook/manager
import { useNotificationStore } from './useNotificationStore';
import { Notification } from '../types/notification';

const useNotificationWebSocket = () => {
  const handleIncomingNotification = useNotificationStore(state => state.handleIncomingNotification);
  const { lastJsonMessage } = useWebSocket(); // Assuming your hook provides the last message

  useEffect(() => {
    if (lastJsonMessage) {
      // TODO: Add strong type checking/validation here (e.g., using Zod)
      const notification = lastJsonMessage as Notification; // Replace with validation
      if (notification && notification.id && notification.type) { // Basic check
         handleIncomingNotification(notification);
      }
    }
  }, [lastJsonMessage, handleIncomingNotification]);
};
*/ 