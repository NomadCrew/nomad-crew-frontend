import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { logger } from '../utils/logger';

export function useAppLifecycle() {
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        logger.debug('APP', 'App has come to the foreground!');
      } else if (nextAppState.match(/inactive|background/)) {
        logger.debug('APP', 'App has gone to the background!');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Clean up: Remove listener when the component unmounts
    return () => {
      subscription.remove();
    };
  }, []);
}