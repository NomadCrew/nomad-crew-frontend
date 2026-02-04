import { useEffect, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

export function useNetworkReconnect(onReconnect: () => void) {
  const { isConnected } = useNetworkStatus();
  const wasDisconnected = useRef(false);

  useEffect(() => {
    if (isConnected === false) {
      wasDisconnected.current = true;
    } else if (isConnected === true && wasDisconnected.current) {
      wasDisconnected.current = false;
      onReconnect();
    }
  }, [isConnected, onReconnect]);

  return { isConnected };
}
