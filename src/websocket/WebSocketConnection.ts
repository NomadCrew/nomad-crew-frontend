import EventEmitter from 'eventemitter3';
import { WebSocketEvent, WebSocketStatus } from '@/src/types/events';

interface ConnectionConfig {
  url: string;
  token: string;
  tripId: string;
  userId: string;
  onStatusChange?: (status: WebSocketStatus) => void;
}

interface HealthCheckConfig {
  pingInterval: number;
  pongTimeout: number;
  maxMissedPongs: number;
}

const DEFAULT_HEALTH_CHECK: HealthCheckConfig = {
  pingInterval: 30000, // 30 seconds
  pongTimeout: 5000,   // 5 seconds
  maxMissedPongs: 3
};

export class WebSocketConnection {
  private ws: WebSocket | null = null;
  private eventEmitter = new EventEmitter();
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private missedPongs = 0;
  private connectionId: string;
  private reconnectAttempt = 0;
  private status: WebSocketStatus = 'DISCONNECTED';
  
  // Flag to track intentional disconnects
  private isManuallyDisconnected = false;

  constructor(
    private config: ConnectionConfig,
    private healthCheck: HealthCheckConfig = DEFAULT_HEALTH_CHECK
  ) {
    this.connectionId = `${config.tripId}-${Date.now()}`;
  }

  private setStatus(status: WebSocketStatus) {
    this.status = status;
    this.config.onStatusChange?.(status);
  }

  private startHealthCheck() {
    this.stopHealthCheck();
    
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
        
        // Schedule pong timeout with an extra guard for manual disconnects
        this.pongTimeout = setTimeout(() => {
          if (this.isManuallyDisconnected) return;
          this.missedPongs++;
          if (this.missedPongs >= this.healthCheck.maxMissedPongs) {
            console.warn('Max missed pongs reached, reconnecting...');
            this.reconnect();
          }
        }, this.healthCheck.pongTimeout);
      }
    }, this.healthCheck.pingInterval);
  }

  private stopHealthCheck() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
    this.missedPongs = 0;
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      
      // Handle pong messages
      if (data.type === 'PONG') {
        if (this.pongTimeout) {
          clearTimeout(this.pongTimeout);
          this.pongTimeout = null;
        }
        this.missedPongs = 0;
        return;
      }
      
      // Emit other messages
      this.eventEmitter.emit('message', data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  public async connect(): Promise<void> {
    // Reset the manual disconnect flag when attempting a connection
    this.isManuallyDisconnected = false;

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = new URL(this.config.url);
        console.log('[WebSocketConnection] Initial URL:', wsUrl.toString());
        
        wsUrl.searchParams.set('connectionId', this.connectionId);
        wsUrl.searchParams.set('token', this.config.token);
        wsUrl.searchParams.set('userId', this.config.userId);

        console.log('[WebSocketConnection] Final WS URL:', wsUrl.toString());

        this.ws = new WebSocket(wsUrl.toString());
        this.setStatus('CONNECTING');

        this.ws.onopen = () => {
          this.setStatus('CONNECTED');
          this.reconnectAttempt = 0;
          this.startHealthCheck();
          resolve();
        };

        this.ws.onclose = (event) => {
          this.handleClose(event);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.setStatus('ERROR');
          reject(error);
        };

        this.ws.onmessage = this.handleMessage.bind(this);

      } catch (error) {
        this.setStatus('ERROR');
        reject(error);
      }
    });
  }

  private handleClose(event: CloseEvent) {
    this.stopHealthCheck();
    
    switch (event.code) {
      case 1000: // Normal closure
        this.setStatus('DISCONNECTED');
        break;
      case 4000: // Custom code: Duplicate connection
        this.setStatus('DISCONNECTED');
        this.eventEmitter.emit('duplicate');
        break;
      case 4001: // Custom code: Inactive
        this.setStatus('DISCONNECTED');
        this.eventEmitter.emit('inactive');
        break;
      case 4002: // Custom code: Maintenance
        this.setStatus('DISCONNECTED');
        this.eventEmitter.emit('maintenance');
        break;
      default:
        if (this.status !== 'DISCONNECTED') {
          this.reconnect();
        }
    }
  }

  private async reconnect() {
    // Do not attempt to reconnect if manually disconnected.
    if (this.isManuallyDisconnected) return;

    if (this.status === 'RECONNECTING') return;
    
    this.setStatus('RECONNECTING');
    const backoffDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempt), 30000);
    
    setTimeout(() => {
      if (this.status === 'RECONNECTING' && !this.isManuallyDisconnected) {
        this.reconnectAttempt++;
        this.connect().catch(() => {
          // Error handling is done in connect()
        });
      }
    }, backoffDelay);
  }

  public disconnect() {
    // Mark as manually disconnected and cancel pending timers.
    this.isManuallyDisconnected = true;
    this.setStatus('DISCONNECTED');
    this.stopHealthCheck();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
    }
  }

  public subscribe(callback: (event: WebSocketEvent) => void): () => void {
    this.eventEmitter.on('message', callback);
    return () => this.eventEmitter.off('message', callback);
  }

  public getStatus(): WebSocketStatus {
    return this.status;
  }

  public getConnectionId(): string {
    return this.connectionId;
  }

  public close(): void {
    this.setStatus('CLOSING');
    this.stopHealthCheck(); // Ensure health checks are stopped
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
      this.removeAllListeners();
      this.ws = null;
    }
    
    // Clear all timeouts and intervals
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
    
    this.missedPongs = 0;
    this.setStatus('DISCONNECTED');
  }

  private removeAllListeners(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
    }
  }
}
