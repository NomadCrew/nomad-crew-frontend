import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { ThemedText } from '@/components/ThemedText';

const MAX_INIT_TIME = 10000; // 10 seconds

export default function AuthErrorBoundary({ children }) {
  const { isInitialized, initialize, loading } = useAuthStore();
  const [error, setError] = useState<Error | null>(null);
  const initTimer = useRef<NodeJS.Timeout | null>(null);
  const initAttempted = useRef(false);

  useEffect(() => {
    console.log('[AuthErrorBoundary] Checking initialization state', {
      isInitialized,
      loading,
      hasError: !!error
    });

    // Only attempt initialization once
    if (!isInitialized && !loading && !initAttempted.current) {
      startInitialization();
    }

    return () => {
      if (initTimer.current) {
        clearTimeout(initTimer.current);
      }
    };
  }, [isInitialized, loading]);

  const startInitialization = async () => {
    console.log('[AuthErrorBoundary] Starting initialization');
    setError(null);
    initAttempted.current = true;

    // Set timeout for initialization
    initTimer.current = setTimeout(() => {
      if (!isInitialized) {
        console.log('[AuthErrorBoundary] Initialization timed out');
        setError(new Error('Initialization timed out'));
      }
    }, MAX_INIT_TIME);

    try {
      await initialize();
      console.log('[AuthErrorBoundary] Initialization complete');
    } catch (err) {
      console.error('[AuthErrorBoundary] Initialization failed:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      if (initTimer.current) {
        clearTimeout(initTimer.current);
      }
    }
  };

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ThemedText className="text-lg font-semibold text-red-500 mb-4">
          Unable to start the app
        </ThemedText>
        <ThemedText className="text-sm text-gray-600 mb-6 text-center">
          {error.message}
        </ThemedText>
        <View
          className="bg-orange-500 px-6 py-3 rounded-lg"
          onTouchEnd={() => {
            initAttempted.current = false; // Allow retry
            startInitialization();
          }}
        >
          <ThemedText className="text-white font-semibold">
            Retry
          </ThemedText>
        </View>
      </View>
    );
  }

  if (!isInitialized || loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#F46315" />
        <ThemedText className="mt-4 text-gray-600">
          Starting up...
        </ThemedText>
      </View>
    );
  }

  return children;
}