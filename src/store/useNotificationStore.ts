import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import {
  Notification,
  TripInviteNotification,
  GenericNotification,
  NotificationType,
  TripInviteEvent,
  isTripInviteNotification
} from '../types/notification';
import { ServerEvent, isTripInviteEvent } from '../types/events';
import { api } from '../api/api-client';
import { logger } from '../utils/logger';

interface NotificationState {
  // Data
  notifications: Notification[];
  unreadCount: number;
  
  // Loading and error states
  loading: boolean;
  error: string | null;
  
  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => void;
  clearNotifications: () => void;
  
  // Trip invite specific actions
  acceptTripInvite: (inviteId: string) => Promise<void>;
  declineTripInvite: (inviteId: string) => Promise<void>;
  
  // Data fetching
  fetchNotifications: () => Promise<void>;
  
  // WebSocket handling
  handleTripInviteEvent: (event: TripInviteEvent) => void;
  
  // Internal helpers
  getNotificationById: (id: string) => Notification | undefined;
  updateNotificationStatus: (id: string, status: string) => void;
}

const STORAGE_KEY = '@nomad_crew_notifications';

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  
  // Add a new notification
  addNotification: (notification: Notification) => {
    set(state => {
      const notifications = [notification, ...state.notifications];
      const unreadCount = notifications.filter(n => !n.isRead).length;
      
      // Persist notifications to storage
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
        .catch(err => logger.error('Failed to save notifications', err));
      
      return { 
        notifications,
        unreadCount
      };
    });
  },
  
  // Mark a notification as read
  markAsRead: async (notificationId: string) => {
    try {
      const notification = get().getNotificationById(notificationId);
      
      if (!notification) {
        return;
      }
      
      // If it's a trip invite, call API to mark as read
      if (isTripInviteNotification(notification)) {
        await api.put(`/api/trip-invites/${notification.inviteId}/read`);
      }
      
      set(state => {
        const updatedNotifications = state.notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        
        const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
        
        // Persist notifications
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications))
          .catch(err => logger.error('Failed to save notifications', err));
        
        return { 
          notifications: updatedNotifications,
          unreadCount
        };
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to mark notification as read' });
      logger.error('Failed to mark notification as read', error);
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      // Get all unread trip invite notifications
      const unreadInvites = get().notifications
        .filter(n => !n.isRead && isTripInviteNotification(n))
        .map(n => (n as TripInviteNotification).inviteId);
      
      // Mark them all as read via API in parallel
      if (unreadInvites.length > 0) {
        await Promise.all(
          unreadInvites.map(inviteId => 
            api.put(`/api/trip-invites/${inviteId}/read`)
          )
        );
      }
      
      set(state => {
        const updatedNotifications = state.notifications.map(n => ({
          ...n,
          isRead: true
        }));
        
        // Persist notifications
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications))
          .catch(err => logger.error('Failed to save notifications', err));
        
        return { 
          notifications: updatedNotifications, 
          unreadCount: 0 
        };
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to mark all notifications as read' });
      logger.error('Failed to mark all notifications as read', error);
    }
  },
  
  // Remove a notification
  removeNotification: (notificationId: string) => {
    set(state => {
      const updatedNotifications = state.notifications.filter(n => n.id !== notificationId);
      const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
      
      // Persist notifications
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications))
        .catch(err => logger.error('Failed to save notifications', err));
      
      return { 
        notifications: updatedNotifications,
        unreadCount
      };
    });
  },
  
  // Clear all notifications
  clearNotifications: () => {
    AsyncStorage.removeItem(STORAGE_KEY)
      .catch(err => logger.error('Failed to clear notifications', err));
    
    set({ 
      notifications: [], 
      unreadCount: 0 
    });
  },
  
  // Accept a trip invite
  acceptTripInvite: async (inviteId: string) => {
    try {
      set({ loading: true, error: null });
      
      // Call API to accept the invite
      await api.post('/api/trip-invites/accept', { inviteId });
      
      // Update notification status
      get().updateNotificationStatus(inviteId, 'accepted');
      
      set({ loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to accept trip invite' 
      });
      logger.error('Failed to accept trip invite', error);
    }
  },
  
  // Decline a trip invite
  declineTripInvite: async (inviteId: string) => {
    try {
      set({ loading: true, error: null });
      
      // Call API to decline the invite
      await api.post('/api/trip-invites/decline', { inviteId });
      
      // Update notification status
      get().updateNotificationStatus(inviteId, 'declined');
      
      set({ loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to decline trip invite' 
      });
      logger.error('Failed to decline trip invite', error);
    }
  },
  
  // Fetch all notifications
  fetchNotifications: async () => {
    try {
      set({ loading: true, error: null });
      
      // First, try to load from storage
      const storedNotifications = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications) as Notification[];
        const unreadCount = parsed.filter(n => !n.isRead).length;
        set({ 
          notifications: parsed, 
          unreadCount,
          loading: false 
        });
      }
      
      // Then fetch from API
      const response = await api.get('/api/trip-invites');
      
      if (response.data && Array.isArray(response.data)) {
        // Convert API response to TripInviteNotification format
        const tripInvites: TripInviteNotification[] = response.data.map((invite: any) => ({
          id: invite.inviteId,
          type: 'TRIP_INVITE' as const,
          inviteId: invite.inviteId,
          tripId: invite.tripId,
          inviterName: invite.inviterName,
          message: invite.message,
          timestamp: invite.timestamp,
          status: invite.status,
          isRead: false // Default to unread for new notifications
        }));
        
        // Merge with existing notifications, prioritizing server data
        const mergedNotifications = [...tripInvites];
        
        // Add any local notifications that aren't trip invites
        const localNonInvites = get().notifications.filter(
          n => !isTripInviteNotification(n)
        );
        
        const updatedNotifications = [...mergedNotifications, ...localNonInvites];
        const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
        
        // Persist to storage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications));
        
        set({ 
          notifications: updatedNotifications,
          unreadCount,
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch notifications' 
      });
      logger.error('Failed to fetch notifications', error);
    }
  },
  
  // Handle WebSocket trip invite event
  handleTripInviteEvent: (event: TripInviteEvent) => {
    const { inviteId, tripId, inviterName, message, timestamp, status } = event.data;
    
    // Create a new notification
    const notification: TripInviteNotification = {
      id: inviteId, // Use inviteId as the notification id
      type: 'TRIP_INVITE',
      inviteId,
      tripId,
      inviterName,
      message,
      timestamp,
      status: status as 'pending' | 'accepted' | 'declined',
      isRead: false
    };
    
    // Add to store
    get().addNotification(notification);
  },
  
  // Get a notification by ID
  getNotificationById: (id: string) => {
    return get().notifications.find(n => n.id === id);
  },
  
  // Update notification status
  updateNotificationStatus: (inviteId: string, status: string) => {
    set(state => {
      const updatedNotifications = state.notifications.map(n => {
        if (isTripInviteNotification(n) && n.inviteId === inviteId) {
          return {
            ...n,
            status: status as 'pending' | 'accepted' | 'declined'
          };
        }
        return n;
      });
      
      // Persist to storage
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications))
        .catch(err => logger.error('Failed to save notifications', err));
      
      return { notifications: updatedNotifications };
    });
  }
})); 