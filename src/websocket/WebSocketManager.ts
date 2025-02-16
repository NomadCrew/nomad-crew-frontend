import { WebSocketConnection } from './WebSocketConnection';
import { WebSocketStatus } from '../types/events';
import { useAuthStore } from '../store/useAuthStore';
import { API_PATHS } from '../utils/api-paths';
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

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  private getWebSocketUrl(tripId: string): string {
    const base = API_CONFIG.BASE_URL.replace(/^http/, 'ws');
    return `${base}/v1/trips/${tripId}/ws?apikey=${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`;
  }

  public async connect(tripId: string, callbacks?: ConnectionCallbacks): Promise<void> {
    if (this.currentTripId === tripId && this.connection?.isConnected()) {
      this.connection.updateCallbacks({ ...this.logger, ...callbacks });
      return;
    }

    try {
      console.log('[WS] Connecting to trip:', tripId);
      const { token, user } = useAuthStore.getState();
      
      if (!token || !user?.id) throw new Error('Not authenticated');

      this.connection = new WebSocketConnection({
        url: this.getWebSocketUrl(tripId),
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
  }
}

// Singleton instance
export const wsManager = WebSocketManager.getInstance();