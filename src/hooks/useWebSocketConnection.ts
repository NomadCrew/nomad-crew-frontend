import { useRef, useEffect, useCallback, useState } from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';
import { 
  WebSocketStatus, 
  WebSocketConfig, 
  WebSocketEvent, 
  WebSocketConnectionState,
  WebSocketQueueItem,
  isWebSocketEvent
} from '@/src/types/events';

const DEFAULT_CONFIG: Partial<WebSocketConfig> = {
  reconnectAttempts: 5,
  reconnectInterval: 1000, // Base interval - will be used with exponential backoff
  pingInterval: 30000,     // 30 seconds
  pongTimeout: 5000       // 5 seconds to receive pong before considering connection dead
};

export interface UseWebSocketConnectionProps extends WebSocketConfig {
  onMessage?: (event: WebSocketEvent) => void;
  onError?: (error: Error) => void;
  onReconnect?: () => void;
}

export function useWebSocketConnection({
  url,
  protocols,
  onMessage,
  onError,
  onReconnect,
  ...customConfig
}: UseWebSocketConnectionProps) {
  console.log('[WebSocketConnection] Hook initialized for URL:', url);
  // Merge custom config with defaults
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  
  // References
  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<WebSocketQueueItem[]>([]);
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>({
    status: 'DISCONNECTED',
    reconnectAttempt: 0,
  });

  // Get auth token
  const { token } = useAuthStore();

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Handle reconnection with exponential backoff
  const reconnect = useCallback(() => {
    const { reconnectAttempts, reconnectInterval } = config;
    const { reconnectAttempt } = connectionState;

    if (reconnectAttempt >= (reconnectAttempts || 5)) {
      setConnectionState(prev => ({
        ...prev,
        status: 'ERROR',
        error: 'Max reconnection attempts reached'
      }));
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      reconnectInterval! * Math.pow(2, reconnectAttempt),
      30000 // Max 30 second delay
    );

    setConnectionState(prev => ({
      ...prev,
      status: 'RECONNECTING',
      reconnectAttempt: prev.reconnectAttempt + 1
    }));

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
      if (onReconnect) {
        onReconnect();
      }
    }, delay);
  }, [connectionState.reconnectAttempt, config, onReconnect]);

  // Connection establishment
  const connect = useCallback(() => {
    console.log('[WebSocketConnection] Connection process started');
    cleanup();

    // Add auth headers
    const fullUrl = new URL(url);
    if (token) {
      fullUrl.searchParams.append('token', token);
    }

    try {
      wsRef.current = new WebSocket(fullUrl.toString(), protocols);
      setConnectionState(prev => ({
        ...prev,
        status: 'CONNECTING'
      }));

      wsRef.current.onopen = () => {
        setConnectionState(prev => ({
          ...prev,
          status: 'CONNECTED',
          error: undefined,
          reconnectAttempt: 0,
          lastPongTimestamp: Date.now()
        }));

        // Start ping interval
        startPingInterval();
      };

      wsRef.current.onclose = (event) => {
        // Handle different close codes
        if (event.code >= 4000 && event.code < 5000) {
          // Application-specific close codes - immediate reconnect
          reconnect();
        } else {
          setConnectionState(prev => ({
            ...prev,
            status: 'DISCONNECTED'
          }));
        }
      };

      wsRef.current.onerror = (error) => {
        const errorMessage = error instanceof Error ? error.message : 'WebSocket error';
        setConnectionState(prev => ({
          ...prev,
          status: 'ERROR',
          error: errorMessage
        }));
        if (onError) {
          onError(new Error(errorMessage));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (isWebSocketEvent(data)) {
            // Update last event ID only for non-PONG messages
            if (data.type !== 'PONG') {
              setConnectionState(prev => ({
                ...prev,
                lastEventId: data.id
              }));
            }

            // Handle pong messages
            if (data.type === 'PONG') {
              setConnectionState(prev => ({
                ...prev,
                lastPongTimestamp: Date.now()
              }));
              return;
            }

            // Process normal messages
            if (onMessage) {
              onMessage(data);
            }
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      setConnectionState(prev => ({
        ...prev,
        status: 'ERROR',
        error: errorMessage
      }));
      if (onError) {
        onError(new Error(errorMessage));
      }
    }
  }, [url, protocols, token, cleanup, onMessage, onError, reconnect]);

  // Start ping interval
  const startPingInterval = useCallback(() => {
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
    }

    pingTimeoutRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'PING' }));
        
        // Set timeout for pong response
        setTimeout(() => {
          const lastPong = connectionState.lastPongTimestamp;
          if (lastPong && Date.now() - lastPong > config.pongTimeout!) {
            // No pong received in time - reconnect
            reconnect();
          }
        }, config.pongTimeout);
      }
    }, config.pingInterval);
  }, [config.pingInterval, config.pongTimeout, connectionState.lastPongTimestamp, reconnect]);

  // Send message with retry logic
  const sendMessage = useCallback((message: WebSocketEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Queue message for retry
      messageQueueRef.current.push({
        id: (message as WebSocketEvent & { id: string }).id,
        message: message as any,
        timestamp: Date.now(),
        retries: 0
      });
    }
  }, []);

  // Effect for initial connection and cleanup
  useEffect(() => {
    console.log('[WebSocketConnection] useEffect triggered for URL:', url);
    connect();
    return cleanup;
  }, [connect, cleanup]);

  // Effect for token changes
  useEffect(() => {
    if (token && connectionState.status === 'DISCONNECTED') {
      connect();
    }
  }, [token, connectionState.status, connect]);

  return {
    connectionState,
    sendMessage,
    reconnect,
    cleanup
  };
}