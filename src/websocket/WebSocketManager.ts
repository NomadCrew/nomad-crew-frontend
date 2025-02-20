import { WebSocketConnection } from './WebSocketConnection';
import { WebSocketStatus } from '../types/events';
import { useAuthStore } from '../store/useAuthStore';
import { API_CONFIG } from '../api/env';

type ConnectionCallback = (event: any) => void;
type StatusCallback = (status: WebSocketStatus) => void;

interface ConnectionCallbacks {
  onMessage?: ConnectionCallback;
  onStatus?: StatusCallback;
  onError?: (error: any) => void;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private connection: WebSocketConnection | null = null;
  private currentTripId: string | null = null;
  private logger: ConnectionCallbacks = {
    onMessage: (event) => console.debug('[WS] Event received', event),
    onStatus: (status) => console.debug('[WS] Status changed', status),
    onError: (error) => console.error('[WS] Connection error', error)
  };
  private authUnsubscribe?: () => void;

  private constructor() {
    // Subscribe to auth changes
    this.authUnsubscribe = useAuthStore.subscribe((state) => {
      if (state.token && this.currentTripId) {
        console.log('[WS] Token updated, reconnecting...');
        this.reconnectWithNewToken(state.token);
      }
    });
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  private getWebSocketUrl(tripId: string, token: string): string {
    const base = API_CONFIG.BASE_URL.replace(/^http/, 'ws');
    return `${base}/v1/trips/${tripId}/ws?apikey=${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}&token=${token}`;
  }

  public async connect(tripId: string, callbacks?: ConnectionCallbacks): Promise<void> {
    if (this.currentTripId === tripId && this.connection?.isConnected()) {
      this.connection.updateCallbacks({ ...this.logger, ...callbacks });
      return;
    }

    try {
      const { token, user } = useAuthStore.getState();
      if (!token || !user?.id) throw new Error('Not authenticated');

      // Create new connection with latest token
      this.connection = new WebSocketConnection({
        url: this.getWebSocketUrl(tripId, token),
        token,
        tripId,
        userId: user.id,
        ...this.logger,
        ...callbacks
      });

      this.currentTripId = tripId;
      await this.connection.connect();
      
    } catch (error) {
      this.disconnect();
      console.error('[WS] Connection failed:', error);
      throw error;
    }
  }

  public disconnect(): void {
    console.log('[WS] Disconnecting');
    this.connection?.disconnect();
    this.connection = null;
    this.currentTripId = null;
    this.authUnsubscribe?.();
  }

  private async reconnectWithNewToken(newToken: string): Promise<void> {
    if (!this.currentTripId) return;

    try {
      const previousTripId = this.currentTripId;
      this.disconnect();
      
      await this.connect(previousTripId, {
        onMessage: this.connection?.getCallbacks().onMessage,
        onStatus: this.connection?.getCallbacks().onStatus,
        onError: this.connection?.getCallbacks().onError
      });
      
      console.log('[WS] Reconnected with new token successfully');
    } catch (error) {
      console.error('[WS] Reconnection failed:', error);
    }
  }
}

// Singleton instance
export const wsManager = WebSocketManager.getInstance();