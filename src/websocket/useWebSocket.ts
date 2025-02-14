import { useEffect, useCallback, useState } from 'react';
import { WebSocketManager } from './WebSocketManager';
import { WebSocketEvent, WebSocketStatus } from '@/src/types/events';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useFocusEffect } from '@react-navigation/native';

interface UseWebSocketOptions {
  onMessage?: (event: WebSocketEvent) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
}

export function useWebSocket(tripId: string | undefined, options: UseWebSocketOptions = {}) {
  const [status, setStatus] = useState<WebSocketStatus>('DISCONNECTED');
  const { token } = useAuthStore();
  const wsManager = WebSocketManager.getInstance();
  const [showWarning, setShowWarning] = useState(false);

  const handleStatus = useCallback((newStatus: WebSocketStatus) => {
    setStatus(newStatus);
    options.onStatusChange?.(newStatus);
    setShowWarning(newStatus === 'DUPLICATE_CONNECTION');
  }, [options.onStatusChange]);

  const connect = useCallback(async () => {
    if (!tripId || !token) return;

    try {
      await wsManager.connect(tripId, {
        onMessage: options.onMessage,
        onStatus: handleStatus
      });
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      handleStatus('ERROR');
    }
  }, [tripId, token, options.onMessage, handleStatus]);

  const disconnect = useCallback(() => {
    if (tripId) {
      wsManager.disconnect();
      handleStatus('DISCONNECTED');
    }
  }, [tripId, handleStatus]);

  // Use both useEffect and useFocusEffect for proper cleanup
  useFocusEffect(
    useCallback(() => {
      connect();
      return () => {
        disconnect();
        wsManager.cleanup();
      };
    }, [connect, disconnect, wsManager])
  );

  // Handle token changes
  useEffect(() => {
    if (token && status === 'DISCONNECTED') {
      connect();
    }
  }, [token, status, connect]);

  return {
    status,
    error: status === 'ERROR' ? 'Connection error' : 
           status === 'DUPLICATE_CONNECTION' ? 'Duplicate connection detected' : null,
    showWarning,
    disconnect,
    reconnect: connect
  };
}

// Custom hook for handling WebSocket errors
export function useWebSocketError(status: WebSocketStatus) {
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    switch (status) {
      case 'ERROR':
        setError('Connection error. Please check your internet connection.');
        setShowWarning(false);
        break;
      case 'DUPLICATE_CONNECTION':
        setError('This trip is open in another window.');
        setShowWarning(true);
        break;
      case 'DISCONNECTED':
        if (error) {
          setError('Disconnected from server.');
          setShowWarning(false);
        }
        break;
      default:
        setError(null);
        setShowWarning(false);
    }
  }, [status, error]);

  return {
    error,
    showWarning,
    clearError: () => setError(null)
  };
}

export const useTripWebSocket = useWebSocket;