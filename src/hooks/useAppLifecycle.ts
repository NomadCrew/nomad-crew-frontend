import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { WebSocketManager } from '../features/websocket/WebSocketManager';

export function useAppLifecycle() {
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    const wsManager = WebSocketManager.getInstance();
    
    switch (nextAppState) {
      case 'active':
        // App came to foreground
        wsManager.resumeAllConnections();
        break;
      case 'background':
        // App went to background
        wsManager.pauseAllConnections();
        break;
      case 'inactive':
        // iOS only - app is in multitasking view
        if (Platform.OS === 'ios') {
          wsManager.pauseAllConnections();
        }
        break;
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);
}