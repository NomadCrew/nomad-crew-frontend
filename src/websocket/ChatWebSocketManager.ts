import { WebSocketConnection } from './WebSocketConnection';
import { ChatEvent, isChatEvent } from '../types/chat';
import { WebSocketStatus } from '../types/events';
import { useAuthStore } from '../store/useAuthStore';
import { API_CONFIG } from '../api/env';
import { jwtDecode } from 'jwt-decode';
import { logger } from '../utils/logger';

interface ChatConnectionCallbacks {
  onMessage?: (event: ChatEvent) => void;
  onStatus?: (status: WebSocketStatus) => void;
  onError?: (error: Error) => void;
}

export class ChatWebSocketManager {
  private static instance: ChatWebSocketManager;
  private connection: WebSocketConnection | null = null;
  private currentGroupId: string | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = API_CONFIG.WEBSOCKET.RECONNECT_ATTEMPTS;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): ChatWebSocketManager {
    if (!ChatWebSocketManager.instance) {
      ChatWebSocketManager.instance = new ChatWebSocketManager();
    }
    return ChatWebSocketManager.instance;
  }

  private getWebSocketUrl(groupId: string, token: string, apiKey: string): string {
    const base = API_CONFIG.BASE_URL.replace(/^http/, 'ws');
    const params = new URLSearchParams({
      token: token,
      apikey: apiKey
    });
    return `${base}/v1/chats/groups/${groupId}/ws?${params.toString()}`;
  }

  public async connect(groupId: string, callbacks?: ChatConnectionCallbacks): Promise<void> {
    try {
      const { token, user } = useAuthStore.getState();
      if (!token || !user?.id) {
        throw new Error('Not authenticated');
      }

      // If already connected to this group, just update callbacks
      if (this.currentGroupId === groupId && this.connection?.isConnected()) {
        this.connection.updateCallbacks(callbacks || {});
        return;
      }

      // Check token expiration
      const decoded = jwtDecode<{ exp: number }>(token);
      const timeUntilExpiry = decoded.exp * 1000 - Date.now();
      
      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 300000) {
        logger.debug('Chat WS', 'Token near expiry, refreshing before connection');
        await useAuthStore.getState().refreshSession();
        return this.connect(groupId, callbacks);
      }

      const apiKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (!apiKey) {
        throw new Error('Missing Supabase API key');
      }

      // Create a wrapper for the onMessage callback to filter chat events
      const wrappedCallbacks = {
        ...callbacks,
        onMessage: (event: any) => {
          if (isChatEvent(event)) {
            callbacks?.onMessage?.(event);
          }
        }
      };

      this.connection = new WebSocketConnection({
        url: this.getWebSocketUrl(groupId, token, apiKey),
        token,
        apiKey,
        tripId: '', // Not used for chat
        userId: user.id,
        ...wrappedCallbacks,
        onError: (error) => {
          callbacks?.onError?.(error);
          if (error.message === 'Authentication failed') {
            useAuthStore.getState().refreshSession()
              .then(() => this.reconnect(groupId, callbacks))
              .catch((err) => logger.error('Chat WS', 'Token refresh failed:', err));
          }
        }
      });

      await this.connection.connect();
      this.currentGroupId = groupId;
      this.reconnectAttempts = 0;

    } catch (error) {
      logger.error('Chat WS', 'Connection failed:', error);
      await this.handleConnectionError(groupId, callbacks);
    }
  }

  private async handleConnectionError(groupId: string, callbacks?: ChatConnectionCallbacks): Promise<void> {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
      logger.debug('Chat WS', `Attempting reconnection in ${delay}ms`, {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.connect(groupId, callbacks);
    }
    
    logger.error('Chat WS', 'Max reconnection attempts reached');
    this.disconnect();
  }

  private async reconnect(groupId: string, callbacks?: ChatConnectionCallbacks): Promise<void> {
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.connect(groupId, callbacks);
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

    this.currentGroupId = null;
    this.reconnectAttempts = 0;
  }

  public isConnected(): boolean {
    return this.connection?.isConnected() || false;
  }

  public getCurrentGroupId(): string | null {
    return this.currentGroupId;
  }
}

export const chatWsManager = ChatWebSocketManager.getInstance(); 