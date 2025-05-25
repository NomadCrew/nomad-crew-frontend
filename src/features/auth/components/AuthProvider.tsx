import React, { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../store';
import { AuthGuard } from './AuthGuard';
import { usePathname, useRouter } from 'expo-router';
import { logger } from '@/src/utils/logger';
import * as Linking from 'expo-linking';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component to manage authentication state and deep linking.
 * It initializes the auth state and handles auth-related redirects.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { initialize, isInitialized } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  // Handle deep links for authentication (e.g., email verification, password reset)
  const handleDeepLink = useCallback(async (event: Linking.EventType) => {
    // Get the deep link URL
    const { url } = event;
    logger.debug('AUTH-PROVIDER', 'Received deep link:', url);

    // Parse the URL to get the path and query parameters
    const parsedUrl = Linking.parse(url);
    
    // Handle authentication deep links
    if (parsedUrl.path?.includes('auth/callback')) {
      // This could be an OAuth callback or email verification
      logger.debug('AUTH-PROVIDER', 'Handling auth callback');
      
      // Re-initialize auth to capture the updated session
      await initialize();
      
      // Redirect to the appropriate screen based on current auth state
      const { user, token } = useAuthStore.getState();
      
      if (user && token) {
        // User is authenticated, redirect to main app
        router.replace('/(tabs)/trips');
      } else {
        // Authentication failed, redirect to login
        router.replace('/(auth)/login');
      }
    }
  }, [initialize, router]);

  // Set up deep link listener
  useEffect(() => {
    // Initialize authentication on component mount
    initialize();

    // Set up deep link handling
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Clean up subscription
    return () => {
      subscription.remove();
    };
  }, [initialize, handleDeepLink]);

  // Wrap everything in AuthGuard for secure routing
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}; 