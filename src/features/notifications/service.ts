import { useNotificationStore } from './store/useNotificationStore';
import { logger } from '@/src/utils/logger';
import { useAuthStore } from '../auth/store';

class NotificationService {
  private userId: string | null = null;

  /**
   * Initialize the notification service: fetch initial data.
   * Real-time notification delivery is handled via WebSocket (WebSocketManager)
   * and push notifications, not Supabase Realtime.
   */
  async initialize() {
    try {
      const authState = useAuthStore.getState();
      if (!authState.user?.id) {
        logger.warn('NotificationService: No user ID found, skipping initialization');
        return;
      }

      this.userId = authState.user.id;
      logger.info('NotificationService: Initializing for user', this.userId);

      // Fetch initial notifications and unread count
      await useNotificationStore.getState().fetchNotifications();
      await useNotificationStore.getState().fetchUnreadCount();
    } catch (error) {
      logger.error('NotificationService: Failed to initialize', error);
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
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
      // Reset local notification state only — do NOT delete from server on logout
      useNotificationStore.getState().reset();
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
