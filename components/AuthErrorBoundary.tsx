import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Pressable } from 'react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { ThemedText } from '@/components/ThemedText';

const MAX_INIT_TIME = 10000; // 10 seconds

export default function AuthErrorBoundary({ children }) {
  const { isInitialized, initialize, loading } = useAuthStore();
  const [error, setError] = useState<Error | null>(null);
  const [initTimer, setInitTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('[AuthErrorBoundary] Starting initialization check');
    if (!isInitialized && !loading) {
      startInitialization();
    }
    return () => {
      if (initTimer) clearTimeout(initTimer);
    };
  }, [isInitialized, loading]);

  const startInitialization = async () => {
    console.log('[AuthErrorBoundary] Starting initialization');
    setError(null);
    const timer = setTimeout(() => {
      if (!isInitialized) {
        console.log('[AuthErrorBoundary] Initialization timed out');
        setError(new Error('Initialization timed out'));
      }
    }, MAX_INIT_TIME);
    
    setInitTimer(timer);

    try {
      await initialize();
      console.log('[AuthErrorBoundary] Initialization complete');
    } catch (err) {
      console.error('[AuthErrorBoundary] Initialization failed:', err);
      setError(err);
    } finally {
      clearTimeout(timer);
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
        <Pressable
          onPress={startInitialization}
          className="bg-orange-500 px-6 py-3 rounded-lg"
        >
          <ThemedText className="text-white font-semibold">
            Retry
          </ThemedText>
        </Pressable>
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