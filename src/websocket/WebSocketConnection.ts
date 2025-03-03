import { WebSocketStatus, ServerEvent, isServerEvent } from '../types/events';
import { logger } from '../utils/logger';

interface ConnectionConfig {
  url: string;
  token: string;
  apiKey: string;
  tripId: string;
  userId: string;
  onMessage?: (event: ServerEvent) => void;
  onStatus?: (status: WebSocketStatus) => void;
  onError?: (error: Error) => void;
}

interface ConnectionCallbacks {
  onMessage?: (event: ServerEvent) => void;
  onStatus?: (status: WebSocketStatus) => void;
  onError?: (error: Error) => void;
}

export class WebSocketConnection {
  private ws: WebSocket | null = null;
  private status: WebSocketStatus = 'DISCONNECTED';
  private readonly config: ConnectionConfig;
  private callbacks: ConnectionCallbacks;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private isManualDisconnect = false;

  constructor(config: ConnectionConfig) {
    this.config = config;
    this.callbacks = {
      onMessage: config.onMessage,
      onStatus: config.onStatus,
      onError: config.onError
    };
  }

  public async connect(): Promise<void> {
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

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

    // Close any existing connection
    if (this.ws) {
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
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (isServerEvent(data)) {
              this.callbacks.onMessage?.(data);
            }
          } catch (error) {
            logger.error('WS', 'Message parse error:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          logger.debug('WS', 'Connection closed:', event.code, event.reason);
          this.setStatus('DISCONNECTED');
          
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

  private handleReconnect(): void {
    this.connectionAttempts++;
    
    if (this.connectionAttempts <= this.MAX_CONNECTION_ATTEMPTS) {
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
    // Clear any reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Set flag to prevent auto-reconnect
    this.isManualDisconnect = true;
    
    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }

  public isConnected(): boolean {
    return this.status === 'CONNECTED';
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
  public send(data: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.error('WS', 'Cannot send message, connection not open');
      return false;
    }
    
    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
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