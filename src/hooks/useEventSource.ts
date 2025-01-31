import SSE from 'react-native-sse';

export type ConnectionState = 'CONNECTING' | 'OPEN' | 'RECONNECTING' | 'CLOSED';

interface SSEConfig {
  url: string;
  headers: Record<string, string>;
  onEvent: (event: any) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
  onStateChange?: (state: ConnectionState) => void;
  // Configuration options
  initialRetryDelay?: number;  // Initial delay between retries (ms)
  maxRetryDelay?: number;      // Maximum delay between retries (ms)
  backoffFactor?: number;      // Multiplier for exponential backoff
  heartbeatTimeout?: number;   // Time before considering connection dead (ms)  
  maxReconnectAttempts?: number; // Maximum number of reconnection attempts
  jitterFactor?: number;       // Random jitter factor (0-1) for retry delays
}

export class EventSourceManager {
  private eventSource: SSE | null = null;
  private retryCount = 0;
  private lastEventId: string | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private config: Required<SSEConfig>;

  constructor(config: SSEConfig) {
    this.config = {
      initialRetryDelay: 1000,
      maxRetryDelay: 30000,
      backoffFactor: 2,
      heartbeatTimeout: 35000,
      maxReconnectAttempts: 10,
      jitterFactor: 0.1,
      onStateChange: () => {},
      ...config
    };
  }

  private getRetryDelay(): number {
    const exponentialDelay = Math.min(
      this.config.initialRetryDelay * Math.pow(this.config.backoffFactor, this.retryCount),
      this.config.maxRetryDelay
    );
    const jitter = exponentialDelay * this.config.jitterFactor * Math.random();
    return exponentialDelay + jitter;
  }

  private startHeartbeatMonitor() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
    }
    this.heartbeatTimer = setTimeout(() => {
      console.warn('[SSE] Heartbeat timeout, reconnecting...');
      this.reconnect();
    }, this.config.heartbeatTimeout);
  }

  private resetHeartbeatMonitor() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
    }
    this.startHeartbeatMonitor();
  }

  private async reconnect() {
    // Inform listeners that we're reconnecting
    this.config.onStateChange('RECONNECTING');
    if (this.retryCount >= this.config.maxReconnectAttempts) {
      console.error('[SSE] Max reconnection attempts reached');
      this.disconnect();
      this.config.onError?.(new Error('Max reconnection attempts reached'));
      return;
    }
    this.disconnect();
    const delay = this.getRetryDelay();
    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.retryCount + 1})`);
    this.reconnectTimer = setTimeout(() => {
      this.retryCount++;
      this.connect();
    }, delay);
  }

  connect() {
    if (this.eventSource) {
      return;
    }
    this.config.onStateChange('CONNECTING');
    try {
      this.eventSource = new SSE(this.config.url, {
        headers: {
          ...this.config.headers,
          'Last-Event-ID': this.lastEventId || '',
        },
      });
      
      // Listen for standard messages
      this.eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.id) {
            this.lastEventId = data.id;
          }
          this.resetHeartbeatMonitor();
          this.config.onEvent(data);
        } catch (error) {
          console.error('[SSE] Error processing event:', error);
        }
      });
  
      // Listen for ping events to reset the heartbeat
      this.eventSource.addEventListener('ping' as any, (event) => {
        console.debug('[SSE] Received ping event.');
        this.resetHeartbeatMonitor();
      });
  
      this.eventSource.addEventListener('error', (error) => {
        this.config.onError?.(error);
        this.reconnect();
      });
      this.eventSource.addEventListener('open', () => {
        this.retryCount = 0; // Reset retry count on successful connection
        this.config.onStateChange('OPEN');
        this.config.onOpen?.();
        this.startHeartbeatMonitor();
      });
    } catch (error) {
      console.error('[SSE] Connection initialization failed:', error);
      this.config.onError?.(error);
      this.reconnect();
    }
  }
  

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.config.onStateChange('CLOSED');
  }
}
