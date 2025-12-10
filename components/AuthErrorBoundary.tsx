import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/src/features/auth/store';
import { ThemedText } from '@/src/components/ThemedText';

const MAX_INIT_TIME = 10000; // 10 seconds

interface AuthErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Wraps app UI and ensures authentication initialization completes before rendering children, showing a loading indicator while initializing and an error screen with retry on failure or timeout.
 *
 * Renders the provided children after successful initialization; renders a loading state while initializing; renders an error view with retry if initialization fails or exceeds the timeout.
 *
 * @param children - React node(s) to render once authentication initialization has completed
 * @returns The wrapped `children` when initialization succeeds, or a loading/error UI otherwise
 */
export default function AuthErrorBoundary({ children }: AuthErrorBoundaryProps) {
  const { isInitialized, initialize, loading } = useAuthStore();
  const [error, setError] = useState<Error | null>(null);
  const initTimer = useRef<NodeJS.Timeout | null>(null);
  const initAttempted = useRef(false);

  const startInitialization = async () => {
    setError(null);
    initAttempted.current = true;

    // Set timeout for initialization
    initTimer.current = setTimeout(() => {
      if (!isInitialized) {
        setError(new Error('Initialization timed out'));
      }
    }, MAX_INIT_TIME);

    try {
      await initialize();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      if (initTimer.current) {
        clearTimeout(initTimer.current);
      }
    }
  };

  useEffect(() => {
    if (isInitialized) {
      return;
    }
    startInitialization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ThemedText className="text-lg font-semibold text-red-500 mb-4">
          Unable to start the app
        </ThemedText>
        <ThemedText className="text-sm text-gray-600 mb-6 text-center">{error.message}</ThemedText>
        <View
          className="bg-orange-500 px-6 py-3 rounded-lg"
          onTouchEnd={() => {
            initAttempted.current = false; // Allow retry
            startInitialization();
          }}
        >
          <ThemedText className="text-white font-semibold">Retry</ThemedText>
        </View>
      </View>
    );
  }

  if (!isInitialized || loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#F46315" />
        <ThemedText className="mt-4 text-gray-600">Starting up...</ThemedText>
      </View>
    );
  }

  return children;
}