import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/src/features/auth/store';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { logger } from '@/src/utils/logger';

/**
 * Selects and renders the correct authentication or onboarding UI based on current auth and onboarding state.
 *
 * @returns A React element that displays a centered loading indicator while initialization is pending, issues redirects to onboarding or app routes for first-time or authenticated users, or renders the authentication Stack screens (login, register, verify-email, invitation) for unauthenticated users.
 */
export default function AuthLayout() {
  const { theme } = useAppTheme();
  const { status, token, isInitialized: authInitialized, needsUsername } = useAuthStore();
  const { isFirstTime, isInitialized: onboardingInitialized } = useOnboarding();

  if (__DEV__) {
    logger.debug(
      'AUTH',
      'Rendering - auth:',
      status,
      'isFirstTime:',
      isFirstTime,
      'needsUsername:',
      needsUsername
    );
  }

  // Show loading while checking auth state
  if (!authInitialized || !onboardingInitialized) {
    if (__DEV__) {
      logger.debug('AUTH', 'Still initializing, showing loading');
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

  // If already authenticated, redirect to appropriate destination
  if (status === 'authenticated' && token) {
    // Check if user needs to complete username setup
    if (needsUsername) {
      if (__DEV__) {
        logger.debug('AUTH', 'Authenticated but needs username, redirecting to username screen');
      }
      return <Redirect href="/(onboarding)/username" />;
    }
    // Fully authenticated - redirect to main app
    if (__DEV__) {
      logger.debug('AUTH', 'Already authenticated, redirecting to tabs');
    }
    return <Redirect href="/(tabs)/trips" />;
  }

  // User is not authenticated - render auth screens
  if (__DEV__) {
    logger.debug('AUTH', 'Not authenticated, rendering auth screens');
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen
        name="verify-email"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="invitation"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
