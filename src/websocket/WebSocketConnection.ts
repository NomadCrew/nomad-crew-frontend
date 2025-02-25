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

  constructor(config: ConnectionConfig) {
    this.config = config;
    this.callbacks = {
      onMessage: config.onMessage,
      onStatus: config.onStatus,
      onError: config.onError
    };
  }

  public async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    return new Promise((resolve, reject) => {
      try {
        logger.debug('WS', 'Establishing connection to:', this.config.url);
        
        this.ws = new WebSocket(this.config.url);
        this.setStatus('CONNECTING');

        this.ws.onopen = () => {
          logger.debug('WS', 'Connection established');
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
          logger.debug('WS', 'Connection closed:', event.code, event.reason);
          this.setStatus('DISCONNECTED');
          if (event.code === 1001 || event.code === 4401) {
            this.callbacks.onError?.(new Error('Authentication failed'));
          }
        };

        this.ws.onerror = (error) => {
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

  public disconnect(): void {
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

  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    this.callbacks.onStatus?.(status);
  }
}