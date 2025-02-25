import { WebSocketConnection } from './WebSocketConnection';
import { WebSocketStatus, ServerEvent } from '../types/events';
import { useAuthStore } from '../store/useAuthStore';
import { API_CONFIG } from '../api/env';
import { jwtDecode } from 'jwt-decode';
import { logger } from '../utils/logger';

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

      this.connection = new WebSocketConnection({
        url: this.getWebSocketUrl(tripId, token, apiKey),
        token,
        apiKey,
        tripId,
        userId: user.id,
        ...callbacks,
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
}

export const wsManager = WebSocketManager.getInstance();