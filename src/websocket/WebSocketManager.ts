import { WebSocketConnection, ServerMessage } from './WebSocketConnection';
import { WebSocketStatus, ServerEvent, isLocationEvent, isChatEvent } from '../types/events';
import { useAuthStore } from '../store/useAuthStore';
import { API_CONFIG } from '../api/env';
import { jwtDecode } from 'jwt-decode';
import { logger } from '../utils/logger';
import { useLocationStore } from '../store/useLocationStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { ZodNotificationSchema, Notification } from '../types/notification';

interface ConnectionCallbacks {
  onMessage?: (event: Notification | ServerEvent) => void;
  onStatus?: (status: WebSocketStatus) => void;
  onError?: (error: Error) => void;
}

interface ConnectedPayload {
  userId: string;
  tripCount: number;
  trips: string[];
}

/**
 * WebSocketManager - Single connection per user architecture
 *
 * This manager maintains ONE WebSocket connection per user (not per trip).
 * The server automatically subscribes the user to all their trips.
 * Dynamic trip subscriptions can be added/removed via messages.
 */
export class WebSocketManager {
  private static instance: WebSocketManager;
  private connection: WebSocketConnection | null = null;
  private tokenRefreshTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = API_CONFIG.WEBSOCKET.RECONNECT_ATTEMPTS;
  private callbacks: ConnectionCallbacks = {};
  private subscribedTrips: Set<string> = new Set();
  private isConnecting = false;

  private constructor() {
    // Singleton - use getInstance()
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  private getWebSocketUrl(token: string): string {
    const base = API_CONFIG.BASE_URL.replace(/^http/, 'ws');
    const params = new URLSearchParams({ token });
    return `${base}/v1/ws?${params.toString()}`;
  }

  /**
   * Connect to WebSocket server.
   * This establishes a single connection for the user.
   * The server automatically subscribes to all user's trips.
   */
  public async connect(callbacks?: ConnectionCallbacks): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      logger.debug('WS', 'Connection already in progress');
      return;
    }

    try {
      this.isConnecting = true;
      const { token, user } = useAuthStore.getState();

      if (!token || !user?.id) {
        throw new Error('Not authenticated');
      }

      // If already connected, just update callbacks
      if (this.connection?.isConnected()) {
        if (callbacks) {
          this.callbacks = { ...this.callbacks, ...callbacks };
        }
        this.isConnecting = false;
        return;
      }

      // Check token expiration
      const decoded = jwtDecode<{ exp: number }>(token);
      const timeUntilExpiry = decoded.exp * 1000 - Date.now();

      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 300000) {
        logger.debug('WS', 'Token near expiry, refreshing before connection');
        await useAuthStore.getState().refreshSession();
        this.isConnecting = false;
        return this.connect(callbacks);
      }

      // Store callbacks
      if (callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
      }

      // Create connection with message handler
      this.connection = new WebSocketConnection({
        url: this.getWebSocketUrl(token),
        token,
        userId: user.id,
        onMessage: (message) => this.handleServerMessage(message),
        onStatus: (status) => {
          this.callbacks.onStatus?.(status);
          if (status === 'DISCONNECTED') {
            this.subscribedTrips.clear();
          }
        },
        onError: (error) => {
          this.callbacks.onError?.(error);
          if (error.message === 'Authentication failed') {
            useAuthStore.getState().refreshSession()
              .then(() => this.reconnect())
              .catch((err) => logger.error('WS', 'Token refresh failed:', err));
          }
        },
      });

      await this.connection.connect();
      this.reconnectAttempts = 0;
      logger.info('WS', 'WebSocket connected');

    } catch (error) {
      logger.error('WS', 'Connection failed:', error);
      await this.handleConnectionError();
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Handle incoming server messages
   */
  private handleServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'connected':
        this.handleConnectedMessage(message.payload as ConnectedPayload);
        break;

      case 'event':
        this.handleEventMessage(message.payload);
        break;

      case 'subscribed':
        {
          const payload = message.payload as { tripId: string };
          this.subscribedTrips.add(payload.tripId);
          logger.debug('WS', `Subscribed to trip: ${payload.tripId}`);
        }
        break;

      case 'unsubscribed':
        {
          const payload = message.payload as { tripId: string };
          this.subscribedTrips.delete(payload.tripId);
          logger.debug('WS', `Unsubscribed from trip: ${payload.tripId}`);
        }
        break;

      case 'pong':
        // Server responded to our ping
        break;

      case 'error':
        logger.error('WS', 'Server error:', message.error);
        this.callbacks.onError?.(new Error(message.error || 'Unknown server error'));
        break;

      default:
        logger.warn('WS', 'Unknown message type:', message.type);
    }
  }

  /**
   * Handle the 'connected' message from server
   */
  private handleConnectedMessage(payload: ConnectedPayload): void {
    logger.info('WS', `Connected as user ${payload.userId}, subscribed to ${payload.tripCount} trips`);

    // Update subscribed trips set
    this.subscribedTrips.clear();
    payload.trips.forEach(tripId => this.subscribedTrips.add(tripId));
  }

  /**
   * Handle event messages (trip events, chat, location, etc.)
   */
  private handleEventMessage(payload: unknown): void {
    if (!payload || typeof payload !== 'object') {
      logger.warn('WS', 'Invalid event payload');
      return;
    }

    const event = payload as ServerEvent;

    // Try to parse as notification first
    const notificationResult = ZodNotificationSchema.safeParse(payload);
    if (notificationResult.success) {
      const notification = notificationResult.data;
      logger.debug('WS', `Received notification: ${notification.type}`);
      useNotificationStore.getState().handleIncomingNotification(notification);
      this.callbacks.onMessage?.(notification);
      return;
    }

    // Handle as ServerEvent
    if (event.type) {
      logger.debug('WS', `Received event: ${event.type}`);

      // Handle location events
      if (isLocationEvent(event) && event.tripId) {
        this.handleLocationEvent(event, event.tripId);
      }

      // Handle chat events
      if (isChatEvent(event)) {
        this.handleChatEvent(event);
      }

      // Forward to callbacks
      this.callbacks.onMessage?.(event);
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
      const { userId, isSharingEnabled } = event.payload as {
        userId: string;
        isSharingEnabled: boolean;
      };
      logger.debug('WS', `User ${userId} ${isSharingEnabled ? 'enabled' : 'disabled'} location sharing`);
    }
  }

  private handleChatEvent(event: ServerEvent): void {
    const { useChatStore } = require('../store/useChatStore');

    logger.debug('WS', 'Received chat event type:', event.type);

    // Handle CHAT_MESSAGE_SEND as MESSAGE_SENT
    const eventType = event.type as string;
    if (eventType === 'CHAT_MESSAGE_SEND') {
      try {
        const payload = event.payload as {
          messageId: string;
          tripId: string;
          content: string;
          user: { id: string; name: string; avatar?: string };
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
              sender: payload.user,
              createdAt: payload.timestamp
            }
          }
        };

        useChatStore.getState().handleChatEvent(mappedEvent);
        return;
      } catch (error) {
        logger.error('WS', 'Error handling CHAT_MESSAGE_SEND:', error);
        return;
      }
    }

    // Map event types to what chat store expects
    let mappedEvent;

    switch (event.type) {
      case 'CHAT_MESSAGE_SENT':
        {
          const payload = event.payload as {
            messageId: string;
            tripId: string;
            content: string;
            user: { id: string; name: string; avatar?: string };
            timestamp: string;
          };

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
                sender: payload.user,
                createdAt: payload.timestamp
              }
            }
          };
        }
        break;

      case 'CHAT_MESSAGE_EDITED':
        {
          const payload = event.payload as { messageId: string; tripId: string; content: string };
          mappedEvent = {
            id: event.id,
            type: 'MESSAGE_EDITED',
            tripId: payload.tripId,
            userId: event.userId,
            timestamp: event.timestamp,
            payload: { messageId: payload.messageId, content: payload.content }
          };
        }
        break;

      case 'CHAT_MESSAGE_DELETED':
        {
          const payload = event.payload as { messageId: string; tripId: string };
          mappedEvent = {
            id: event.id,
            type: 'MESSAGE_DELETED',
            tripId: payload.tripId,
            userId: event.userId,
            timestamp: event.timestamp,
            payload: { messageId: payload.messageId }
          };
        }
        break;

      case 'CHAT_REACTION_ADDED':
        {
          const payload = event.payload as {
            messageId: string;
            tripId: string;
            reaction: string;
            user: { id: string; name: string; avatar?: string };
          };
          mappedEvent = {
            id: event.id,
            type: 'REACTION_ADDED',
            tripId: payload.tripId,
            userId: event.userId,
            timestamp: event.timestamp,
            payload: { messageId: payload.messageId, reaction: payload.reaction, user: payload.user }
          };
        }
        break;

      case 'CHAT_REACTION_REMOVED':
        {
          const payload = event.payload as {
            messageId: string;
            tripId: string;
            reaction: string;
            user: { id: string; name: string; avatar?: string };
          };
          mappedEvent = {
            id: event.id,
            type: 'REACTION_REMOVED',
            tripId: payload.tripId,
            userId: event.userId,
            timestamp: event.timestamp,
            payload: { messageId: payload.messageId, reaction: payload.reaction, userId: payload.user.id }
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
          mappedEvent = {
            id: event.id,
            type: 'CHAT_READ_RECEIPT',
            tripId: payload.tripId || event.tripId,
            userId: payload.userId || event.userId,
            timestamp: event.timestamp,
            payload: {
              messageId: payload.messageId,
              user: { id: payload.userId, name: payload.userName, avatar: payload.userAvatar },
              timestamp: payload.timestamp || event.timestamp
            }
          };
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
            payload: { userId: payload.userId, isTyping: payload.isTyping, username: payload.username }
          };
        }
        break;

      default:
        logger.warn('WS', `Unknown chat event type: ${event.type}`);
        return;
    }

    if (mappedEvent) {
      useChatStore.getState().handleChatEvent(mappedEvent);
    }
  }

  private async handleConnectionError(): Promise<void> {
    this.reconnectAttempts++;

    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
      logger.debug('WS', `Attempting reconnection in ${delay}ms`, {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.connect();
    }

    logger.error('WS', 'Max reconnection attempts reached');
    this.disconnect();
  }

  private async reconnect(): Promise<void> {
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.connect();
  }

  /**
   * Subscribe to a specific trip's events
   * Used when user joins a new trip while connected
   */
  public subscribeToTrip(tripId: string): boolean {
    if (!this.connection?.isConnected()) {
      logger.warn('WS', 'Cannot subscribe to trip: not connected');
      return false;
    }

    if (this.subscribedTrips.has(tripId)) {
      logger.debug('WS', `Already subscribed to trip: ${tripId}`);
      return true;
    }

    return this.connection.send({
      type: 'subscribe',
      payload: { tripId }
    });
  }

  /**
   * Unsubscribe from a specific trip's events
   * Used when user leaves a trip while connected
   */
  public unsubscribeFromTrip(tripId: string): boolean {
    if (!this.connection?.isConnected()) {
      logger.warn('WS', 'Cannot unsubscribe from trip: not connected');
      return false;
    }

    if (!this.subscribedTrips.has(tripId)) {
      logger.debug('WS', `Not subscribed to trip: ${tripId}`);
      return true;
    }

    return this.connection.send({
      type: 'unsubscribe',
      payload: { tripId }
    });
  }

  /**
   * Check if subscribed to a specific trip
   */
  public isSubscribedToTrip(tripId: string): boolean {
    return this.subscribedTrips.has(tripId);
  }

  /**
   * Get list of subscribed trip IDs
   */
  public getSubscribedTrips(): string[] {
    return Array.from(this.subscribedTrips);
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

    this.subscribedTrips.clear();
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  /**
   * Pause connection when app goes to background
   */
  public pauseAllConnections(): void {
    if (this.connection) {
      this.connection.disconnect();
    }
  }

  /**
   * Resume connection when app comes to foreground
   */
  public resumeAllConnections(): void {
    this.connect();
  }

  /**
   * Send a message through the WebSocket
   */
  public send(type: string, payload: Record<string, unknown>): boolean {
    if (!this.connection?.isConnected()) {
      logger.error('WS', 'Cannot send message, not connected');
      return false;
    }

    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      logger.error('WS', 'Cannot send message, no user ID');
      return false;
    }

    return this.connection.send({ type, payload: { ...payload, userId } });
  }

  /**
   * Send a chat message
   */
  public sendChatMessage(tripId: string, content: string, messageId: string): boolean {
    const user = useAuthStore.getState().user;
    if (!user) {
      logger.error('WS', 'Cannot send chat message, user not logged in');
      return false;
    }

    return this.send('CHAT_MESSAGE_SEND', {
      tripId,
      content,
      messageId,
      user: {
        id: user.id,
        name: user.username || user.firstName || 'You',
        avatar: user.profilePicture
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send typing status
   */
  public sendTypingStatus(tripId: string, isTyping: boolean): boolean {
    const user = useAuthStore.getState().user;
    if (!user) {
      return false;
    }

    return this.send('TYPING_STATUS', {
      tripId,
      isTyping,
      userId: user.id,
      username: user.username || user.firstName || 'You'
    });
  }

  /**
   * Send read receipt
   */
  public sendReadReceipt(tripId: string, messageId: string): boolean {
    const user = useAuthStore.getState().user;
    if (!user) {
      return false;
    }

    return this.send('READ_RECEIPT', {
      tripId,
      messageId,
      userId: user.id,
      userName: user.username || user.firstName || 'You',
      userAvatar: user.profilePicture,
      timestamp: new Date().toISOString()
    });
  }

  public isConnected(): boolean {
    return this.connection?.isConnected() || false;
  }
}

export const wsManager = WebSocketManager.getInstance();
