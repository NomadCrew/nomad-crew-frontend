import { WebSocketConnection } from './WebSocketConnection';
import { WebSocketStatus, ServerEvent, isLocationEvent, isChatEvent } from '../types/events';
import { useAuthStore } from '../store/useAuthStore';
import { API_CONFIG } from '../api/env';
import { jwtDecode } from 'jwt-decode';
import { logger } from '../utils/logger';
import { useLocationStore } from '../store/useLocationStore';

interface ConnectionCallbacks {
  onMessage?: (event: ServerEvent) => void;
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

      // Create a wrapper for the onMessage callback to handle location events and chat events
      const wrappedCallbacks = {
        ...callbacks,
        onMessage: (event: ServerEvent) => {
          // Handle location events
          if (isLocationEvent(event)) {
            this.handleLocationEvent(event, tripId);
          }
          
          // Handle chat events
          if (isChatEvent(event)) {
            this.handleChatEvent(event);
          }
          
          // Pass the event to the original callback
          callbacks?.onMessage?.(event);
        }
      };

      this.connection = new WebSocketConnection({
        url: this.getWebSocketUrl(tripId, token, apiKey),
        token,
        apiKey,
        tripId,
        userId: user.id,
        ...wrappedCallbacks,
        onError: (error) => {
          callbacks?.onError?.(error);
          if (error.message === 'Authentication failed') {
            useAuthStore.getState().refreshSession()
              .then(() => this.reconnect(tripId, callbacks))
              .catch((err) => logger.error('WS', 'Token refresh failed:', err));
          }
        }
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
      const { userId, name, location } = event.payload as any;
      
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
      const { userId, isSharingEnabled } = event.payload as any;
      
      // You might want to update UI or take other actions based on this event
      logger.debug('WS', `User ${userId} ${isSharingEnabled ? 'enabled' : 'disabled'} location sharing`);
    }
  }

  private handleChatEvent(event: ServerEvent): void {
    // Forward the chat event to the chat store
    const { useChatStore } = require('../store/useChatStore');
    
    // Add detailed logging of the raw event
    logger.debug('WS', 'Received chat event type:', event.type);
    logger.debug('WS', 'Raw event data:', JSON.stringify(event, null, 2));
    
    // Map the new event types to the old ones expected by the chat store
    let mappedEvent;
    
    switch (event.type) {
      case 'CHAT_MESSAGE_SENT':
        {
          const payload = event.payload as {
            messageId: string;
            groupId: string;
            content: string;
            user: {
              id: string;
              name: string;
              avatar?: string;
            };
            timestamp: string;
          };
          
          mappedEvent = {
            id: event.id,
            type: 'MESSAGE_SENT',
            groupId: payload.groupId,
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
        }
        break;
        
      case 'CHAT_MESSAGE_EDITED':
        {
          const payload = event.payload as {
            messageId: string;
            groupId: string;
            content: string;
          };
          
          mappedEvent = {
            id: event.id,
            type: 'MESSAGE_EDITED',
            groupId: payload.groupId,
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
            groupId: string;
          };
          
          mappedEvent = {
            id: event.id,
            type: 'MESSAGE_DELETED',
            groupId: payload.groupId,
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
            groupId: string;
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
            groupId: payload.groupId,
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
            groupId: string;
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
            groupId: payload.groupId,
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
            groupId: string;
            user: {
              id: string;
              name: string;
              avatar?: string;
            };
          };
          
          mappedEvent = {
            id: event.id,
            type: 'MESSAGE_READ',
            groupId: payload.groupId,
            userId: event.userId,
            timestamp: event.timestamp,
            payload: {
              messageId: payload.messageId,
              userId: payload.user.id
            }
          };
        }
        break;
        
      case 'CHAT_TYPING_STATUS':
        {
          const payload = event.payload as {
            groupId: string;
            userId: string;
            isTyping: boolean;
            username: string;
          };
          
          mappedEvent = {
            id: event.id,
            type: 'TYPING_STATUS',
            groupId: payload.groupId,
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
    }

    this.currentTripId = null;
    this.reconnectAttempts = 0;
  }

  public send(type: string, payload: any): boolean {
    if (!this.connection || !this.isConnected() || !this.currentTripId) {
      logger.error('WS', 'Cannot send message, not connected');
      return false;
    }
    
    try {
      const message = {
        type,
        tripId: this.currentTripId,
        userId: useAuthStore.getState().user?.id,
        payload
      };
      
      logger.debug('WS', `Sending message of type ${type}`);
      return this.connection.send(message);
    } catch (error) {
      logger.error('WS', 'Error sending message:', error);
      return false;
    }
  }

  public isConnected(): boolean {
    return this.connection?.isConnected() || false;
  }

  /**
   * Send typing status to the server
   * @param groupId The chat group ID
   * @param isTyping Whether the user is typing or not
   * @returns True if the message was sent, false otherwise
   */
  public sendTypingStatus(groupId: string, isTyping: boolean): boolean {
    if (!this.connection || !this.isConnected()) {
      logger.warn('WS', 'Cannot send typing status: not connected');
      return false;
    }

    const { user } = useAuthStore.getState();
    if (!user) {
      logger.warn('WS', 'Cannot send typing status: no user');
      return false;
    }

    return this.send('CHAT_TYPING_STATUS', {
      groupId,
      isTyping,
      user: {
        id: user.id,
        name: user.username || user.firstName || 'User',
        avatar: user.profilePicture
      }
    });
  }
}

export const wsManager = WebSocketManager.getInstance();