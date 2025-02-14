import { WebSocketConnection } from './WebSocketConnection';
import { createPlatformStorage, ConnectionInfo } from './WebSocketStorage';
import { WebSocketEvent, WebSocketStatus } from '@/src/types/events';
import { useAuthStore } from '@/src/store/useAuthStore';
import { API_CONFIG } from '@/src/api/env';

type ConnectionCallback = (event: WebSocketEvent) => void;
type StatusCallback = (status: WebSocketStatus) => void;

interface ConnectionCallbacks {
  onMessage?: ConnectionCallback;
  onStatus?: StatusCallback;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private connections: Map<string, WebSocketConnection> = new Map();
  private storage = createPlatformStorage();
  private callbacks: Map<string, ConnectionCallbacks> = new Map();
  private activeConnection: WebSocketConnection | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  private getWebSocketUrl(tripId: string): string {
    const baseUrl = new URL(API_CONFIG.BASE_URL);
    const protocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = new URL(`${protocol}//${baseUrl.host}/v1/trips/${tripId}/ws`);
    
    // Add required authentication parameters
    url.searchParams.set('apikey', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!);
    console.log('[WebSocketManager] Base WS URL:', url.toString());
    return url.toString();
  }

  private async handleExistingConnection(tripId: string): Promise<void> {
    const existing = await this.storage.checkExistingConnection(tripId);
    if (existing) {
      // Connection exists in another tab/window
      const currentTime = Date.now();
      const connectionAge = currentTime - existing.timestamp;
      
      if (connectionAge < 30000) { // 30 seconds grace period
        throw new Error('Connection already exists in another window');
      } else {
        // Old connection, can be replaced
        await this.storage.unregisterConnection(tripId);
      }
    }
  }

  public async connect(
    tripId: string, 
    callbacks?: ConnectionCallbacks
  ): Promise<void> {
    if (this.activeConnection) {
      // Already connected
      return;
    }

    try {
      // Check authentication
      const authStore = useAuthStore.getState();
      const token = authStore.token;
      const userId = authStore.user?.id;

      if (!token || !userId) {
        throw new Error('Not authenticated');
      }

      // Check for existing connections
      await this.handleExistingConnection(tripId);

      // Create new connection
      const connection = new WebSocketConnection({
        url: this.getWebSocketUrl(tripId),
        token,
        tripId,
        userId,
        onStatusChange: (status) => {
          this.callbacks.get(tripId)?.onStatus?.(status);

          // Handle disconnection cleanup
          if (status === 'DISCONNECTED') {
            this.storage.unregisterConnection(tripId).catch(console.error);
          }
        }
      });

      // Store callbacks
      if (callbacks) {
        this.callbacks.set(tripId, callbacks);
      }

      // Connect and register
      await connection.connect();
      
      // Register the connection
      await this.storage.registerConnection(tripId, {
        connectionId: connection.getConnectionId(),
        timestamp: Date.now(),
        userId
      });

      // Set up message handler
      connection.subscribe((event) => {
        this.callbacks.get(tripId)?.onMessage?.(event);
      });

      // Store the connection
      this.connections.set(tripId, connection);

      // Set up event listeners
      connection.subscribe((event) => {
        switch (event.type) {
          case 'ERROR':
            if (event.payload.code === 4000) { // Duplicate connection
              this.handleDuplicateConnection(tripId);
            }
            break;
        }
      });

      this.activeConnection = connection;

    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      throw error;
    }
  }

  private async handleDuplicateConnection(tripId: string) {
    const connection = this.connections.get(tripId);
    if (connection) {
      // Show warning and start countdown
      this.callbacks.get(tripId)?.onStatus?.('DUPLICATE_CONNECTION' as WebSocketStatus);
      
      // Give 5 seconds before disconnecting
      setTimeout(() => {
        this.disconnect();
      }, 5000);
    }
  }

  public disconnect(): void {
    if (this.activeConnection) {
      console.log('Closing WebSocket connection');
      this.activeConnection.disconnect();
      this.activeConnection = null;
    }
  }

  public getStatus(tripId: string): WebSocketStatus {
    return this.connections.get(tripId)?.getStatus() || 'DISCONNECTED';
  }

  public updateCallbacks(tripId: string, callbacks: ConnectionCallbacks): void {
    this.callbacks.set(tripId, callbacks);
  }

  public async cleanup(): Promise<void> {
    // First disconnect active connection
    if (this.activeConnection) {
      this.activeConnection.close();
      this.activeConnection = null;
    }
  
    // Clear all connections
    for (const connection of this.connections.values()) {
      connection.close();
    }
    this.connections.clear();
    this.callbacks.clear();
  
    // Clean up storage
    await this.storage.cleanup();
  }
}