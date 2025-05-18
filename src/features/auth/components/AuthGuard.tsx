import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store';
import { logger } from '@/src/utils/logger';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard component to protect routes that require authentication.
 * Redirects to login screen if user is not authenticated.
 * Also handles token refreshing when necessary.
 */
export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, isInitialized, token, refreshToken, refreshSession, status } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Don't do anything until auth is initialized
    if (!isInitialized) {
      return;
    }

    const checkAuth = async () => {
      setIsCheckingAuth(true);
      
      try {
        // Get the first segment to determine if we're in an auth route
        const firstSegment = segments[0];
        const isAuthGroup = firstSegment === '(auth)';
        
        // If we have a user and token, but we're in auth group, redirect to main app
        if (user && token && isAuthGroup) {
          logger.debug('AUTH-GUARD', 'User is authenticated but on auth route, redirecting to app');
          router.replace('/(tabs)/trips');
          return;
        }
        
        // If we don't have a user or token, and we're not in auth group, try to refresh
        if ((!user || !token) && !isAuthGroup) {
          logger.debug('AUTH-GUARD', 'User not authenticated, attempting refresh');
          
          if (refreshToken) {
            try {
              await refreshSession();
              // If refresh is successful (no error thrown), we can continue
              logger.debug('AUTH-GUARD', 'Token refresh successful');
            } catch (error) {
              // If refresh fails, redirect to login
              logger.error('AUTH-GUARD', 'Token refresh failed, redirecting to login', error);
              router.replace('/(auth)/login');
              return;
            }
          } else {
            // No refresh token, redirect to login
            logger.debug('AUTH-GUARD', 'No refresh token available, redirecting to login');
            router.replace('/(auth)/login');
            return;
          }
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [isInitialized, user, token, refreshToken, segments, router, refreshSession]);

  // Show loading spinner while checking authentication
  if (isCheckingAuth || !isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Render children once authentication is confirmed
  return <>{children}</>;
}; 