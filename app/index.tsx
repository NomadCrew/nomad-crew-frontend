import React from 'react';
import { Redirect } from 'expo-router';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { useAuthStore } from '@/src/features/auth/store';
import { View, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { logger } from '@/src/utils/logger';

/**
 * Selects and renders the initial screen or redirect based on onboarding and authentication state.
 *
 * Shows a themed full-screen loading indicator while auth or onboarding initialization is pending.
 * After initialization, redirects to:
 * - onboarding welcome when the user is first-time,
 * - authentication login when the user is not authenticated or missing a token,
 * - onboarding username when the authenticated user still needs to set a username,
 * - main app tabs when the user is fully authenticated and has no blockers.
 *
 * @returns A React element that renders either the themed loading indicator or a Redirect to the appropriate route.
 */
export default function Index() {
  const { theme } = useAppTheme();
  const { status, token, isInitialized: authInitialized, needsUsername } = useAuthStore();
  const { isFirstTime, isInitialized: onboardingInitialized } = useOnboarding();

  if (__DEV__) {
    logger.debug(
      'AUTH',
      'Index - auth:',
      status,
      'isFirstTime:',
      isFirstTime,
      'needsUsername:',
      needsUsername
    );
  }

  // Show loading while checking state
  if (!authInitialized || !onboardingInitialized) {
    if (__DEV__) {
      logger.debug('AUTH', 'Index still initializing, showing loading');
    }
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background.default,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  // If first time user, redirect to onboarding
  if (isFirstTime) {
    if (__DEV__) {
      logger.debug('AUTH', 'First time user, redirecting to onboarding');
    }
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // If not authenticated, redirect to login
  if (status !== 'authenticated' || !token) {
    if (__DEV__) {
      logger.debug('AUTH', 'Not authenticated, redirecting to login');
    }
    return <Redirect href="/(auth)/login" />;
  }

  // If user needs to set username, redirect to username screen
  if (needsUsername) {
    if (__DEV__) {
      logger.debug('AUTH', 'User needs username, redirecting to username screen');
    }
    return <Redirect href="/(onboarding)/username" />;
  }

  // User is fully authenticated - redirect to main app
  if (__DEV__) {
    logger.debug('AUTH', 'Authenticated, redirecting to tabs');
  }
  return <Redirect href="/(tabs)/trips" />;
}
