import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import {
  Notification,
  TripInviteNotification,
  TripUpdateNotification,
  TodoNotification,
  MemberNotification,
  WeatherNotification,
  ChatNotification,
  LocationNotification,
  GenericNotification,
  NotificationType,
  TripInviteEvent,
  isTripInviteNotification
} from '../types/notification';
import { 
  ServerEvent, 
  isTripInviteEvent,
  isTripEvent,
  isTodoEvent,
  isMemberEvent,
  isWeatherEvent,
  isChatEvent,
  isLocationEvent
} from '../types/events';
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
  
  // WebSocket event handling
  handleTripInviteEvent: (event: TripInviteEvent) => void;
  handleServerEvent: (event: ServerEvent) => void;
  handleTripEvent: (event: ServerEvent) => void;
  handleTodoEvent: (event: ServerEvent) => void;
  handleMemberEvent: (event: ServerEvent) => void;
  handleWeatherEvent: (event: ServerEvent) => void;
  handleChatEvent: (event: ServerEvent) => void;
  handleLocationEvent: (event: ServerEvent) => void;
  
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
      // Check if we already have this notification (prevent duplicates)
      const existingIndex = state.notifications.findIndex(n => n.id === notification.id);
      
      let notifications: Notification[];
      if (existingIndex !== -1) {
        // Update existing notification
        notifications = [...state.notifications];
        notifications[existingIndex] = notification;
      } else {
        // Add new notification to the beginning of the array
        notifications = [notification, ...state.notifications];
      }
      
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
  
  // Main handler for server events - routes to specific handlers
  handleServerEvent: (event: ServerEvent) => {
    logger.debug('NOTIFICATION', `Handling server event of type: ${event.type}`);
    
    if (isTripInviteEvent(event)) {
      get().handleTripInviteEvent(event as any);
    } else if (isTripEvent(event)) {
      get().handleTripEvent(event);
    } else if (isTodoEvent(event)) {
      get().handleTodoEvent(event);
    } else if (isMemberEvent(event)) {
      get().handleMemberEvent(event);
    } else if (isWeatherEvent(event)) {
      get().handleWeatherEvent(event);
    } else if (isChatEvent(event)) {
      get().handleChatEvent(event);
    } else if (isLocationEvent(event)) {
      get().handleLocationEvent(event);
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
  
  // Handle trip events
  handleTripEvent: (event: ServerEvent) => {
    if (!event.payload) return;
    
    const payload = event.payload as any;
    const tripId = event.tripId;
    const userId = event.userId || 'system';
    
    // Skip self-triggered events to reduce noise
    const currentUserId = require('../store/useAuthStore').useAuthStore.getState().user?.id;
    if (userId === currentUserId) return;
    
    let notification: TripUpdateNotification;
    
    switch (event.type) {
      case 'TRIP_UPDATED':
        notification = {
          id: event.id,
          type: 'TRIP_UPDATE',
          tripId,
          tripName: payload.name || 'Trip',
          updaterName: payload.updaterName || 'Someone',
          updateType: 'details',
          timestamp: event.timestamp,
          isRead: false,
          data: {
            oldValue: payload.oldValue,
            newValue: payload.newValue
          }
        };
        break;
      
      case 'TRIP_STARTED':
      case 'TRIP_ENDED':
      case 'TRIP_STATUS_UPDATED':
        notification = {
          id: event.id,
          type: 'TRIP_STATUS',
          tripId,
          tripName: payload.name || 'Trip',
          updaterName: payload.updaterName || 'Someone',
          updateType: 'status',
          timestamp: event.timestamp,
          isRead: false,
          data: {
            statusChange: {
              from: payload.oldStatus || 'unknown',
              to: payload.status || 'unknown'
            }
          }
        };
        break;
      
      default:
        return; // Unknown trip event type
    }
    
    get().addNotification(notification);
  },
  
  // Handle todo events
  handleTodoEvent: (event: ServerEvent) => {
    if (!event.payload) return;
    
    const payload = event.payload as any;
    const tripId = event.tripId;
    
    // Skip self-triggered events to reduce noise
    const currentUserId = require('../store/useAuthStore').useAuthStore.getState().user?.id;
    if (payload.createdBy === currentUserId) return;
    
    let notification: TodoNotification;
    
    switch (event.type) {
      case 'TODO_CREATED':
        notification = {
          id: event.id,
          type: 'TODO_CREATED',
          tripId,
          todoId: payload.id,
          todoText: payload.text,
          creatorName: payload.creatorName || 'Someone',
          timestamp: event.timestamp,
          isRead: false,
          data: {
            assignedToName: payload.assignedToName
          }
        };
        break;
      
      case 'TODO_UPDATED':
        notification = {
          id: event.id,
          type: 'TODO_UPDATED',
          tripId,
          todoId: payload.id,
          todoText: payload.text,
          creatorName: payload.updaterName || 'Someone',
          timestamp: event.timestamp,
          isRead: false
        };
        break;
      
      case 'TODO_COMPLETED':
        notification = {
          id: event.id,
          type: 'TODO_COMPLETED',
          tripId,
          todoId: payload.id,
          todoText: payload.text,
          creatorName: payload.updaterName || 'Someone',
          timestamp: event.timestamp,
          isRead: false,
          data: {
            completedByName: payload.completedByName || 'Someone'
          }
        };
        break;
      
      default:
        return; // Unknown todo event type
    }
    
    get().addNotification(notification);
  },
  
  // Handle member events
  handleMemberEvent: (event: ServerEvent) => {
    if (!event.payload) return;
    
    const payload = event.payload as any;
    const tripId = event.tripId;
    
    // Skip self-triggered events to reduce noise
    const currentUserId = require('../store/useAuthStore').useAuthStore.getState().user?.id;
    if (payload.actorId === currentUserId) return;
    
    let notification: MemberNotification;
    
    switch (event.type) {
      case 'MEMBER_ADDED':
        notification = {
          id: event.id,
          type: 'MEMBER_ADDED',
          tripId,
          tripName: payload.tripName || 'Trip',
          memberName: payload.memberName || 'Someone',
          timestamp: event.timestamp,
          isRead: false,
          data: {
            role: payload.role,
            actorName: payload.actorName
          }
        };
        break;
      
      case 'MEMBER_REMOVED':
        notification = {
          id: event.id,
          type: 'MEMBER_REMOVED',
          tripId,
          tripName: payload.tripName || 'Trip',
          memberName: payload.memberName || 'Someone',
          timestamp: event.timestamp,
          isRead: false,
          data: {
            actorName: payload.actorName
          }
        };
        break;
      
      case 'MEMBER_ROLE_UPDATED':
        notification = {
          id: event.id,
          type: 'MEMBER_ROLE_UPDATED',
          tripId,
          tripName: payload.tripName || 'Trip',
          memberName: payload.memberName || 'Someone',
          timestamp: event.timestamp,
          isRead: false,
          data: {
            role: payload.role,
            previousRole: payload.previousRole,
            actorName: payload.actorName
          }
        };
        break;
      
      default:
        return; // Unknown member event type
    }
    
    get().addNotification(notification);
  },
  
  // Handle weather events
  handleWeatherEvent: (event: ServerEvent) => {
    if (!event.payload) return;
    
    const payload = event.payload as any;
    const tripId = event.tripId;
    
    let notification: WeatherNotification;
    
    switch (event.type) {
      case 'WEATHER_UPDATED':
        // Only notify of significant weather changes
        if (!payload.significant) return;
        
        notification = {
          id: event.id,
          type: 'WEATHER_UPDATED',
          tripId,
          tripLocation: payload.location || 'your destination',
          timestamp: event.timestamp,
          isRead: false,
          data: {
            weatherCode: payload.weather_code,
            temperature: payload.temperature_2m
          }
        };
        break;
      
      case 'WEATHER_ALERT':
        notification = {
          id: event.id,
          type: 'WEATHER_ALERT',
          tripId,
          tripLocation: payload.location || 'your destination',
          timestamp: event.timestamp,
          isRead: false,
          data: {
            alertType: payload.alert_type,
            alertSeverity: payload.severity || 'warning',
            alertMessage: payload.message
          }
        };
        break;
      
      default:
        return; // Unknown weather event type
    }
    
    get().addNotification(notification);
  },
  
  // Handle chat events
  handleChatEvent: (event: ServerEvent) => {
    if (!event.payload) return;
    
    const payload = event.payload as any;
    const tripId = event.tripId;
    
    // Skip self-triggered events to reduce noise
    const currentUserId = require('../store/useAuthStore').useAuthStore.getState().user?.id;
    if (payload.user?.id === currentUserId) return;
    
    // Only notify for new messages, not other chat events
    if (event.type === 'CHAT_MESSAGE_SENT') {
      const notification: ChatNotification = {
        id: event.id,
        type: 'CHAT_MESSAGE',
        tripId,
        chatId: payload.groupId || tripId,
        senderName: payload.user?.name || 'Someone',
        timestamp: event.timestamp,
        isRead: false,
        data: {
          messageId: payload.messageId,
          messagePreview: payload.content?.substring(0, 50) + (payload.content?.length > 50 ? '...' : '')
        }
      };
      
      get().addNotification(notification);
    }
  },
  
  // Handle location events
  handleLocationEvent: (event: ServerEvent) => {
    if (!event.payload) return;
    
    const payload = event.payload as any;
    const tripId = event.tripId;
    
    // Skip self-triggered events
    const currentUserId = require('../store/useAuthStore').useAuthStore.getState().user?.id;
    if (payload.userId === currentUserId) return;
    
    // Only notify for important location updates (can be customized)
    if (event.type === 'LOCATION_UPDATED' && payload.isSignificant) {
      const notification: LocationNotification = {
        id: event.id,
        type: 'LOCATION_UPDATED',
        tripId,
        memberName: payload.name || 'Someone',
        timestamp: event.timestamp,
        isRead: false,
        data: {
          location: {
            latitude: payload.location.latitude,
            longitude: payload.location.longitude
          },
          locationName: payload.locationName
        }
      };
      
      get().addNotification(notification);
    }
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