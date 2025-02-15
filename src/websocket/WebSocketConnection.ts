import { 
  WebSocketStatus, 
  ServerEventType,
  isServerEvent,
  EventSchemas
} from '@/src/types/events';

interface ConnectionConfig {
  url: string;
  token: string;
  tripId: string;
  userId: string;
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
        url.searchParams.set('token', this.config.token);
        url.searchParams.set('userId', this.config.userId);
        url.searchParams.set('apikey', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!);

        console.log('[WS] Final connection URL:', url.toString());
        this.ws = new WebSocket(url.toString());
        this.setStatus('CONNECTING');

        this.ws.onopen = () => {
          console.log('[WS] Connection established');
          this.setStatus('CONNECTED');
          resolve();
        };

        this.ws.onmessage = (event) => {
          console.log('[WS] Raw message received:', event.data);
          try {
            const data = JSON.parse(event.data);
            console.debug('[WS] Parsed event:', { 
              type: data.type, 
              tripId: data.tripId 
            });
            
            if (isServerEvent(data)) {
              this.callbacks.onMessage?.(data);
            } else {
              console.warn('[WS] Invalid event format:', data);
            }
          } catch (error) {
            console.error('[WS] Message parse failed:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('[WS] Connection closed:', event.reason);
          this.setStatus('DISCONNECTED');
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Connection error:', error);
          this.callbacks.onError?.(error);
          reject(error);
        };

      } catch (error) {
        console.error('[WS] Connection setup failed:', error);
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
}