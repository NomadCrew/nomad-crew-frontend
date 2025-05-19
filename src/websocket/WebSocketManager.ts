import { WebSocketConnection } from '../features/websocket/WebSocketConnection';
import { WebSocketStatus, ServerEvent, BaseEventSchema, isLocationEvent, isChatEvent } from '../types/events';
import { useAuthStore } from '../features/auth/store';
import { API_CONFIG } from '../api/env';
import { jwtDecode } from 'jwt-decode';
import { logger } from '../utils/logger';
import { useLocationStore } from '../features/location/store/useLocationStore';
import { useNotificationStore } from '../features/notifications/store/useNotificationStore';
import { ZodNotificationSchema, Notification } from '../features/notifications/types/notification';
import { ZodError } from 'zod';

interface ConnectionCallbacks {
  onMessage?: (event: Notification | ServerEvent) => void;
  onStatus?: (status: WebSocketStatus) => void;
  onError?: (error: Error) => void;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private connection: WebSocketConnection | null = null;
  private currentTripId: string | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = API_CONFIG.WEBSOCKET.RECONNECT_ATTEMPTS;

  private constructor() {
    // Simplified constructor - we handle auth state changes directly
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  private getWebSocketUrl(tripId: string, token: string, apiKey: string): string {
    const base = API_CONFIG.BASE_URL.replace(/^http/, 'ws');
    const params = new URLSearchParams({
      token: token,
      apikey: apiKey
    });
    return `${base}/v1/trips/${tripId}/ws?${params.toString()}`;
  }

  public async connect(tripId: string, callbacks?: ConnectionCallbacks): Promise<void> {
    try {
      const { token, user } = useAuthStore.getState();
      if (!token || !user?.id) {
        throw new Error('Not authenticated');
      }

      // If already connected to this trip, just update callbacks
      if (this.currentTripId === tripId && this.connection?.isConnected()) {
        this.connection.updateCallbacks(callbacks || {});
        return;
      }

      // Check token expiration
      const decoded = jwtDecode<{ exp: number }>(token);
      const timeUntilExpiry = decoded.exp * 1000 - Date.now();
      
      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 300000) {
        logger.debug('WS', 'Token near expiry, refreshing before connection');
        await useAuthStore.getState().refreshSession();
        return this.connect(tripId, callbacks);
      }

      const apiKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (!apiKey) {
        throw new Error('Missing Supabase API key');
      }

      // Create a wrapper for the onMessage callback
      const wrappedCallbacks: ConnectionCallbacks = {
        ...callbacks,
        onMessage: (messageData: any) => {
          let parsedData: any;
          try {
            parsedData = JSON.parse(messageData);
          } catch (error) {
            logger.error('WS', 'Failed to parse incoming JSON message:', error);
            return;
          }

          // Attempt 1: Validate as a standardized Notification object
          const notificationResult = ZodNotificationSchema.safeParse(parsedData);

          if (notificationResult.success) {
            const validatedNotification = notificationResult.data;
            logger.debug('WS', `Received valid Notification object, type: ${validatedNotification.type}`);

            // Handle with the notification store
            useNotificationStore.getState().handleIncomingNotification(validatedNotification);

            // Pass the validated Notification object to the original callback
            callbacks?.onMessage?.(validatedNotification);
            return;
          }

          // Attempt 2: Handle as other ServerEvent types (e.g., Location, Chat)
          if (typeof parsedData === 'object' && parsedData !== null && parsedData.type) {
             const eventData = parsedData as ServerEvent;
              logger.debug('WS', `Attempting to handle as ServerEvent, type: ${eventData.type}`);

              let handled = false;
              if (isLocationEvent(eventData)) {
                this.handleLocationEvent(eventData, tripId);
                handled = true;
              }

              if (isChatEvent(eventData)) {
                this.handleChatEvent(eventData);
                handled = true;
              }

              callbacks?.onMessage?.(eventData);

          } else {
              logger.warn('WS', 'Received message is not a valid Notification or recognizable ServerEvent:', parsedData);
          }
        },
        onError: (error) => {
          callbacks?.onError?.(error);
          if (error.message === 'Authentication failed') {
            useAuthStore.getState().refreshSession()
              .then(() => this.reconnect(tripId, callbacks))
              .catch((err: Error) => logger.error('WS', 'Token refresh failed:', err));
          }
        },
        onStatus: callbacks?.onStatus,
      };

      this.connection = new WebSocketConnection({
        url: this.getWebSocketUrl(tripId, token, apiKey),
        token,
        apiKey,
        tripId,
        userId: user.id,
        ...wrappedCallbacks,
      });

      await this.connection.connect();
      this.currentTripId = tripId;
      this.reconnectAttempts = 0;

    } catch (error) {
      logger.error('WS', 'Connection failed:', error);
      await this.handleConnectionError(tripId, callbacks);
    }
  }

  private handleLocationEvent(event: ServerEvent, tripId: string): void {
    if (event.type === 'LOCATION_UPDATED' && event.payload) {
      const { userId, name, location } = event.payload as {
        userId: string;
        name?: string;
        location: {
          latitude: number;
          longitude: number;
          accuracy?: number;
          timestamp: number;
        }
      };
      
      if (userId && location) {
        useLocationStore.getState().updateMemberLocation(tripId, {
          userId,
          name,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: location.timestamp
          }
        });
      }
    } else if (event.type === 'LOCATION_SHARING_CHANGED' && event.payload) {
      // Handle location sharing status changes if needed
      const { userId, isSharingEnabled } = event.payload as {
        userId: string;
        isSharingEnabled: boolean;
      };
      
      // You might want to update UI or take other actions based on this event
      logger.debug('WS', `User ${userId} ${isSharingEnabled ? 'enabled' : 'disabled'} location sharing`);
    }
  }

  private handleChatEvent(event: ServerEvent): void {
    // Forward the chat event to the chat store
    const { useChatStore } = require('../features/chat/store');
    
    // Add detailed logging of the raw event
    logger.debug('WS', 'Received chat event type:', event.type);
    logger.debug('WS', 'Raw event data:', JSON.stringify(event, null, 2));
    
    // Special handling for CHAT_MESSAGE_SEND events (not in the ServerEventType enum)
    // Use type assertion to handle custom event type
    const eventType = event.type as string;
    if (eventType === 'CHAT_MESSAGE_SEND') {
      logger.debug('WS', 'Handling CHAT_MESSAGE_SEND event as MESSAGE_SENT');
      
      try {
        const payload = event.payload as {
          messageId: string;
          tripId: string;
          content: string;
          user: {
            id: string;
            name: string;
            avatar?: string;
          };
          timestamp: string;
        };
        
        const mappedEvent = {
          id: event.id,
          type: 'MESSAGE_SENT',
          tripId: payload.tripId,
          userId: event.userId || payload.user.id,
          timestamp: event.timestamp || payload.timestamp,
          payload: {
            message: {
              id: payload.messageId,
              content: payload.content,
              sender: {
                id: payload.user.id,
                name: payload.user.name,
                avatar: payload.user.avatar
              },
              createdAt: payload.timestamp
            }
          }
        };
        
        logger.debug('WS', 'Created MESSAGE_SENT event from CHAT_MESSAGE_SEND with message ID:', payload.messageId);
        useChatStore.getState().handleChatEvent(mappedEvent);
        return;
      } catch (error) {
        logger.error('WS', 'Error handling CHAT_MESSAGE_SEND event:', error);
        return;
      }
    }
    
    // Map the new event types to the ones expected by the chat store
    let mappedEvent;
    
    switch (event.type) {
      case 'CHAT_MESSAGE_SENT':
        {
          const payload = event.payload as {
            messageId: string;
            tripId: string;
            content: string;
            user: {
              id: string;
              name: string;
              avatar?: string;
            };
            timestamp: string;
          };
          
          logger.debug('WS', 'Mapping CHAT_MESSAGE_SENT event to MESSAGE_SENT');
          
          mappedEvent = {
            id: event.id,
            type: 'MESSAGE_SENT',
            tripId: payload.tripId,
            userId: event.userId,
            timestamp: event.timestamp,
            payload: {
              message: {
                id: payload.messageId,
                content: payload.content,
                sender: {
                  id: payload.user.id,
                  name: payload.user.name,
                  avatar: payload.user.avatar
                },
                createdAt: payload.timestamp
              }
            }
          };
          
          logger.debug('WS', 'Created MESSAGE_SENT event with message ID:', payload.messageId);
        }
        break;
        
      case 'CHAT_MESSAGE_EDITED':
        {
          const payload = event.payload as {
            messageId: string;
            tripId: string;
            content: string;
          };
          
          mappedEvent = {
            id: event.id,
            type: 'MESSAGE_EDITED',
            tripId: payload.tripId,
            userId: event.userId,
            timestamp: event.timestamp,
            payload: {
              messageId: payload.messageId,
              content: payload.content
            }
          };
        }
        break;
        
      case 'CHAT_MESSAGE_DELETED':
        {
          const payload = event.payload as {
            messageId: string;
            tripId: string;
          };
          
          mappedEvent = {
            id: event.id,
            type: 'MESSAGE_DELETED',
            tripId: payload.tripId,
            userId: event.userId,
            timestamp: event.timestamp,
            payload: {
              messageId: payload.messageId
            }
          };
        }
        break;
        
      case 'CHAT_REACTION_ADDED':
        {
          const payload = event.payload as {
            messageId: string;
            tripId: string;
            reaction: string;
            user: {
              id: string;
              name: string;
              avatar?: string;
            };
          };
          
          mappedEvent = {
            id: event.id,
            type: 'REACTION_ADDED',
            tripId: payload.tripId,
            userId: event.userId,
            timestamp: event.timestamp,
            payload: {
              messageId: payload.messageId,
              reaction: payload.reaction,
              user: payload.user
            }
          };
        }
        break;
        
      case 'CHAT_REACTION_REMOVED':
        {
          const payload = event.payload as {
            messageId: string;
            tripId: string;
            reaction: string;
            user: {
              id: string;
              name: string;
              avatar?: string;
            };
          };
          
          mappedEvent = {
            id: event.id,
            type: 'REACTION_REMOVED',
            tripId: payload.tripId,
            userId: event.userId,
            timestamp: event.timestamp,
            payload: {
              messageId: payload.messageId,
              reaction: payload.reaction,
              userId: payload.user.id
            }
          };
        }
        break;
        
      case 'CHAT_READ_RECEIPT':
        {
          const payload = event.payload as {
            messageId: string;
            tripId: string;
            userId: string;
            userName: string;
            userAvatar?: string;
            timestamp: string;
          };
          
          logger.debug('WS', 'Mapping CHAT_READ_RECEIPT event');
          
          mappedEvent = {
            id: event.id,
            type: 'CHAT_READ_RECEIPT',
            tripId: payload.tripId || event.tripId,
            userId: payload.userId || event.userId,
            timestamp: event.timestamp,
            payload: {
              messageId: payload.messageId,
              user: {
                id: payload.userId,
                name: payload.userName,
                avatar: payload.userAvatar
              },
              timestamp: payload.timestamp || event.timestamp
            }
          };
          
          logger.debug('WS', 'Created CHAT_READ_RECEIPT event for message ID:', payload.messageId);
        }
        break;
        
      case 'CHAT_TYPING_STATUS':
        {
          const payload = event.payload as {
            tripId: string;
            userId: string;
            isTyping: boolean;
            username: string;
          };
          
          mappedEvent = {
            id: event.id,
            type: 'TYPING_STATUS',
            tripId: payload.tripId,
            userId: event.userId,
            timestamp: event.timestamp,
            payload: {
              userId: payload.userId,
              isTyping: payload.isTyping,
              username: payload.username
            }
          };
        }
        break;
        
      default:
        // Unknown chat event type
        logger.warn('WS', `Unknown chat event type: ${event.type}`);
        return;
    }
    
    // Log the mapped event
    logger.debug('WS', 'Mapped event type:', mappedEvent?.type);
    logger.debug('WS', 'Mapped event data:', JSON.stringify(mappedEvent, null, 2));
    
    // Forward the mapped event to the chat store
    useChatStore.getState().handleChatEvent(mappedEvent);
  }

  private async handleConnectionError(tripId: string, callbacks?: ConnectionCallbacks): Promise<void> {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
      logger.debug('WS', `Attempting reconnection in ${delay}ms`, {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.connect(tripId, callbacks);
    }
    
    logger.error('WS', 'Max reconnection attempts reached');
    this.disconnect();
  }

  private async reconnect(tripId: string, callbacks?: ConnectionCallbacks): Promise<void> {
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.connect(tripId, callbacks);
  }

  public disconnect(): void {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }

    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
      this.currentTripId = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Pause all WebSocket connections when app goes to background
   */
  public pauseAllConnections(): void {
    if (this.connection) {
      this.connection.disconnect();
    }
  }

  /**
   * Resume all WebSocket connections when app comes to foreground
   */
  public resumeAllConnections(): void {
    if (this.currentTripId) {
      this.connect(this.currentTripId);
    }
  }

  public send(type: string, payload: Record<string, unknown>): boolean {
    logger.debug('WS', `send method called with type: ${type}`);
    
    if (!this.connection) {
      logger.error('WS', 'Cannot send message, no connection object');
      return false;
    }
    
    if (!this.isConnected()) {
      logger.error('WS', 'Cannot send message, not connected');
      return false;
    }
    
    if (!this.currentTripId) {
      logger.error('WS', 'Cannot send message, no current trip ID');
      return false;
    }
    
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        logger.error('WS', 'Cannot send message, no user ID');
        return false;
      }
      
      const message = {
        type,
        tripId: this.currentTripId,
        userId,
        payload
      };
      
      logger.debug('WS', `Sending message of type ${type} to trip ${this.currentTripId}`);
      logger.debug('WS', 'Message payload:', JSON.stringify(payload, null, 2));
      
      const result = this.connection.send(message);
      logger.debug('WS', `Message send result: ${result ? 'success' : 'failure'}`);
      
      return result;
    } catch (error) {
      logger.error('WS', 'Error sending message:', error);
      return false;
    }
  }

  // Simplified method to send chat messages
  public sendChatMessage(tripId: string, content: string, messageId: string): boolean {
    const user = useAuthStore.getState().user;
    if (!user) {
      logger.error('WS', 'Cannot send chat message, user not logged in');
      return false;
    }

    const messagePayload = {
      tripId,
      content,
      messageId,
      user: {
        id: user.id,
        name: user.username || user.firstName || 'You',
        avatar: user.profilePicture
      },
      timestamp: new Date().toISOString()
    };

    return this.send('CHAT_MESSAGE_SEND', messagePayload);
  }

  // Simplified method to send typing status
  public sendTypingStatus(tripId: string, isTyping: boolean): boolean {
    const user = useAuthStore.getState().user;
    if (!user) {
      logger.error('WS', 'Cannot send typing status, user not logged in');
      return false;
    }

    const typingPayload = {
      tripId,
      isTyping,
      userId: user.id,
      username: user.username || user.firstName || 'You'
    };

    return this.send('TYPING_STATUS', typingPayload);
  }

  public isConnected(): boolean {
    const connected = this.connection?.isConnected() || false;
    logger.debug('WS', `WebSocketManager.isConnected() called, result: ${connected}`);
    return connected;
  }

  public sendReadReceipt(tripId: string, messageId: string): boolean {
    logger.debug('WS', `Sending read receipt for message ${messageId} in trip ${tripId}`);
    
    if (!this.connection || !this.connection.isConnected()) {
      logger.warn('WS', 'Cannot send read receipt: WebSocket not connected');
      return false;
    }
    
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        logger.warn('WS', 'Cannot send read receipt: User not authenticated');
        return false;
      }
      
      const payload = {
        tripId,
        messageId,
        userId: user.id,
        userName: user.username || user.firstName || 'You',
        userAvatar: user.profilePicture,
        timestamp: new Date().toISOString()
      };
      
      return this.send('READ_RECEIPT', payload);
    } catch (error) {
      logger.error('WS', 'Error sending read receipt:', error);
      return false;
    }
  }
}

export const wsManager = WebSocketManager.getInstance();