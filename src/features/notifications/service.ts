import { supabase } from '@/src/api/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useNotificationStore } from './store/useNotificationStore';
import { parseNotification, Notification } from './types/notification';
import { logger } from '@/src/utils/logger';
import { useAuthStore } from '../auth/store';

class NotificationService {
  private channel: RealtimeChannel | null = null;
  private userId: string | null = null;

  /**
   * Initialize the notification service and set up Realtime listeners
   */
  async initialize() {
    try {
      // Get the current user ID from auth store
      const authState = useAuthStore.getState();
      if (!authState.user?.id) {
        logger.warn('NotificationService: No user ID found, skipping initialization');
        return;
      }

      this.userId = authState.user.id;
      logger.info('NotificationService: Initializing for user', this.userId);

      // Set up the Supabase Realtime channel
      this.setupRealtimeChannel();

      // Fetch initial notifications
      await useNotificationStore.getState().fetchNotifications();
      await useNotificationStore.getState().fetchUnreadCount();
    } catch (error) {
      logger.error('NotificationService: Failed to initialize', error);
    }
  }

  /**
   * Set up Supabase Realtime channel to listen for notifications
   */
  private setupRealtimeChannel() {
    if (!this.userId) {
      logger.warn('NotificationService: Cannot set up channel without user ID');
      return;
    }

    // Clean up existing channel if any
    this.cleanup();

    // Create a new channel for notifications
    this.channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          logger.info('NotificationService: Received notification', payload);
          this.handleNotificationInsert(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          logger.info('NotificationService: Notification updated', payload);
          this.handleNotificationUpdate(payload.new);
        }
      )
      .subscribe((status) => {
        logger.info('NotificationService: Channel subscription status', status);
      });
  }

  /**
   * Handle new notification from Realtime
   */
  private handleNotificationInsert(data: any) {
    try {
      // Parse the notification data from the database
      const notification = parseNotification(data);
      if (notification) {
        // Add to store
        useNotificationStore.getState().handleIncomingNotification(notification);
        
        // Log for debugging
        logger.info('NotificationService: Processed new notification', {
          type: notification.type,
          priority: notification.priority,
          id: notification.id,
        });
      } else {
        logger.warn('NotificationService: Failed to parse notification', data);
      }
    } catch (error) {
      logger.error('NotificationService: Error handling notification insert', error);
    }
  }

  /**
   * Handle notification update from Realtime
   */
  private handleNotificationUpdate(data: any) {
    try {
      const notification = parseNotification(data);
      if (notification) {
        // Update in store if it exists
        const store = useNotificationStore.getState();
        const existingIndex = store.notifications.findIndex(n => n.id === notification.id);
        
        if (existingIndex !== -1) {
          // Update the notification in the store
          const updatedNotifications = [...store.notifications];
          updatedNotifications[existingIndex] = notification;
          
          useNotificationStore.setState({
            notifications: updatedNotifications,
          });

          // Update unread count if read status changed
          if (notification.read && !store.notifications[existingIndex].read) {
            store.fetchUnreadCount();
          }
        }
      }
    } catch (error) {
      logger.error('NotificationService: Error handling notification update', error);
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.channel) {
      logger.info('NotificationService: Cleaning up channel');
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.userId = null;
  }

  /**
   * Re-initialize when user changes
   */
  async reinitialize(userId: string) {
    logger.info('NotificationService: Re-initializing for user', userId);
    this.cleanup();
    this.userId = userId;
    await this.initialize();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Helper to set up auth state listener
export const setupNotificationServiceListener = () => {
  // Listen for auth state changes
  useAuthStore.subscribe((state, prevState) => {
    // User logged in
    if (state.user?.id && !prevState.user?.id) {
      notificationService.initialize();
    }
    // User logged out
    else if (!state.user?.id && prevState.user?.id) {
      notificationService.cleanup();
      // Clear notifications from store
      useNotificationStore.getState().clearNotifications();
    }
    // User changed
    else if (state.user?.id && prevState.user?.id && state.user.id !== prevState.user.id) {
      notificationService.reinitialize(state.user.id);
    }
  });

  // Initialize if user is already logged in
  const currentUser = useAuthStore.getState().user;
  if (currentUser?.id) {
    notificationService.initialize();
  }
};