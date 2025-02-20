import { 
  WebSocketStatus, 
  ServerEventType,
  isServerEvent,
  EventSchemas
} from '@/src/types/events';
import { logger } from '@/src/utils/logger';

interface ConnectionConfig {
  url: string;
  token: string;
  tripId: string;
  userId: string;
  onMessage?: (event: any) => void;
  onStatus?: (status: WebSocketStatus) => void;
  onError?: (error: any) => void;
}

interface ConnectionCallbacks {
  onMessage?: (event: any) => void;
  onStatus?: (status: WebSocketStatus) => void;
  onError?: (error: any) => void;
}

export class WebSocketConnection {
  private ws: WebSocket | null = null;
  private status: WebSocketStatus = 'DISCONNECTED';
  private callbacks: ConnectionCallbacks;

  constructor(private config: ConnectionConfig) {
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
        const url = new URL(this.config.url);
        logger.debug('WS', 'Establishing connection to:', url.hostname);
        
        this.ws = new WebSocket(url.toString());
        this.setStatus('CONNECTING');

        this.ws.onopen = () => {
          logger.debug('WS', 'Connection established');
          this.setStatus('CONNECTED');
          resolve();
        };

        this.ws.onmessage = (event) => {
          logger.debug('WS', 'Message received');
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
          logger.debug('WS', 'Connection closed:', event.reason);
          this.setStatus('DISCONNECTED');
        };

        this.ws.onerror = (error) => {
          logger.error('WS', 'Connection error:', error);
          reject(error);
        };

      } catch (error) {
        logger.error('WS', 'Connection setup failed:', error);
        reject(error);
      }
    });
  }

  public disconnect(): void {
    this.ws?.close(1000, 'Normal closure');
    this.setStatus('DISCONNECTED');
  }

  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    this.callbacks.onStatus?.(status);
  }

  public isConnected(): boolean {
    return this.status === 'CONNECTED';
  }

  public updateCallbacks(callbacks: Partial<ConnectionCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getCallbacks() {
    return this.callbacks;
  }
}