import { WebSocketStatus } from '../types/events';
import { logger } from '../utils/logger';

export interface ServerMessage {
  type: 'connected' | 'event' | 'pong' | 'subscribed' | 'unsubscribed' | 'error';
  payload?: unknown;
  error?: string;
}

export interface ConnectionConfig {
  url: string;
  token: string;
  userId: string;
  onMessage?: (message: ServerMessage) => void;
  onStatus?: (status: WebSocketStatus) => void;
  onError?: (error: Error) => void;
}

interface ConnectionCallbacks {
  onMessage?: (message: ServerMessage) => void;
  onStatus?: (status: WebSocketStatus) => void;
  onError?: (error: Error) => void;
}

export class WebSocketConnection {
  private ws: WebSocket | null = null;
  private status: WebSocketStatus = 'DISCONNECTED';
  private readonly config: ConnectionConfig;
  private callbacks: ConnectionCallbacks;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private isManualDisconnect = false;

  // Connection health monitoring
  private lastMessageTime = 0;
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 15000; // Check every 15 seconds
  private readonly PING_INTERVAL = 25000; // Send ping every 25 seconds
  private readonly CONNECTION_STALE_THRESHOLD = 60000; // 60 seconds with no messages

  constructor(config: ConnectionConfig) {
    this.config = config;
    this.callbacks = {
      onMessage: config.onMessage,
      onStatus: config.onStatus,
      onError: config.onError
    };
  }

  public async connect(): Promise<void> {
    // Clear any existing timers
    this.clearTimers();

    // Reset manual disconnect flag
    this.isManualDisconnect = false;

    // If already connected, don't try to connect again
    if (this.ws?.readyState === WebSocket.OPEN) {
      logger.debug('WS', 'Already connected, not reconnecting');
      return;
    }

    // If connecting, wait for it to complete or fail
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      logger.debug('WS', 'Connection already in progress');
      return;
    }

    // Close any existing connection and clean up handlers
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }

    return new Promise((resolve, reject) => {
      try {
        logger.debug('WS', 'Establishing connection to:', this.config.url);

        this.ws = new WebSocket(this.config.url);
        this.setStatus('CONNECTING');

        // Set a connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            logger.error('WS', 'Connection timeout');
            this.ws?.close();
            this.setStatus('ERROR');
            reject(new Error('Connection timeout'));
          }
        }, 10000); // 10 second timeout

        this.ws.onopen = () => {
          logger.debug('WS', 'Connection established');
          clearTimeout(connectionTimeout);
          this.connectionAttempts = 0;
          this.setStatus('CONNECTED');

          // Initialize last message time
          this.lastMessageTime = Date.now();

          // Start connection health monitoring and ping
          this.startHealthMonitoring();
          this.startPingInterval();

          resolve();
        };

        this.ws.onmessage = (event) => {
          // Update last message time on any message
          this.lastMessageTime = Date.now();

          try {
            if (typeof event.data === 'string') {
              const message = JSON.parse(event.data) as ServerMessage;
              logger.debug('WS', 'Received message type:', message.type);
              this.callbacks.onMessage?.(message);
            }
          } catch (error) {
            logger.error('WS', 'Message parse error:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          logger.debug('WS', 'Connection closed:', event.code, event.reason);
          this.setStatus('DISCONNECTED');

          // Clear health monitoring
          this.clearTimers();

          if (this.isManualDisconnect) {
            // Don't attempt to reconnect if this was a manual disconnect
            return;
          }

          if (event.code === 1001 || event.code === 4401) {
            this.callbacks.onError?.(new Error('Authentication failed'));
          } else if (event.code !== 1000) {
            // Only attempt to reconnect for abnormal closures
            this.handleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          logger.error('WS', 'Connection error:', error);
          this.setStatus('ERROR');
          reject(error);
        };

      } catch (error) {
        logger.error('WS', 'Connection setup failed:', error);
        this.setStatus('ERROR');
        reject(error);
      }
    });
  }

  private startHealthMonitoring(): void {
    // Clear any existing health check timer
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Start health check interval
    this.healthCheckTimer = setInterval(() => {
      this.checkConnectionHealth();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private startPingInterval(): void {
    // Clear any existing ping timer
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }

    // Send periodic pings to keep connection alive
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, this.PING_INTERVAL);
  }

  private checkConnectionHealth(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const connectionAge = Date.now() - this.lastMessageTime;

    // If no messages received for too long, connection might be stale
    if (connectionAge > this.CONNECTION_STALE_THRESHOLD) {
      logger.warn('WS', 'Connection appears stale, reconnecting...');

      // Close the connection and let the reconnect logic handle it
      this.ws.close();
    }
  }

  private clearTimers(): void {
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Clear health check timer
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Clear ping timer
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private handleReconnect(): void {
    this.connectionAttempts++;

    if (this.connectionAttempts <= this.MAX_CONNECTION_ATTEMPTS) {
      // Implement exponential backoff for reconnection
      const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts - 1), 30000);
      logger.debug('WS', `Scheduling reconnection in ${delay}ms (attempt ${this.connectionAttempts}/${this.MAX_CONNECTION_ATTEMPTS})`);

      this.reconnectTimer = setTimeout(() => {
        logger.debug('WS', `Attempting reconnection (${this.connectionAttempts}/${this.MAX_CONNECTION_ATTEMPTS})`);
        this.connect().catch(error => {
          logger.error('WS', 'Reconnection failed:', error);
        });
      }, delay);
    } else {
      logger.error('WS', 'Max reconnection attempts reached');
      this.callbacks.onError?.(new Error('Max reconnection attempts reached'));
    }
  }

  public disconnect(): void {
    // Clear all timers
    this.clearTimers();

    // Set flag to prevent auto-reconnect
    this.isManualDisconnect = true;

    if (this.ws) {
      // Clear event handlers before closing to prevent memory leaks
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;

      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }

  public isConnected(): boolean {
    const connected = this.status === 'CONNECTED';
    return connected;
  }

  public updateCallbacks(callbacks: Partial<ConnectionCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getCallbacks(): ConnectionCallbacks {
    return this.callbacks;
  }

  /**
   * Send a message through the WebSocket connection
   * @param data The data to send
   * @returns True if the message was sent, false otherwise
   */
  public send(data: Record<string, unknown> | string): boolean {
    if (!this.ws) {
      logger.error('WS', 'Cannot send message, WebSocket is null');
      return false;
    }

    if (this.ws.readyState !== WebSocket.OPEN) {
      logger.error('WS', `Cannot send message, connection not open. Current state: ${this.ws.readyState}`);
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);

      // Update last message time when sending a message
      this.lastMessageTime = Date.now();

      return true;
    } catch (error) {
      logger.error('WS', 'Error sending message:', error);
      return false;
    }
  }

  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    this.callbacks.onStatus?.(status);
  }
}
