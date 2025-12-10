import React from 'react';
import { Stack, Redirect, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/src/features/auth/store';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { logger } from '@/src/utils/logger';

/**
 * Coordinates onboarding flow rendering and route-guarding for onboarding screens.
 *
 * Renders a centered loading indicator while authentication or onboarding state is initializing.
 * Returns Redirects to enforce authentication and step order for the username and contact-email screens (redirecting to login, username, contact-email, or the main app tabs as appropriate).
 * When no redirect conditions apply, renders the onboarding navigation Stack containing welcome, permissions, username, and contact-email screens.
 *
 * @returns The React element for the onboarding layout: a loading view, a redirect, or the onboarding Stack depending on current app state.
 */
export default function OnboardingLayout() {
  const { theme } = useAppTheme();
  const {
    status,
    token,
    isInitialized: authInitialized,
    needsUsername,
    needsContactEmail,
  } = useAuthStore();
  const { isFirstTime, isInitialized: onboardingInitialized } = useOnboarding();
  const segments = useSegments();

  // Get current onboarding screen from segments
  const currentScreen = segments[segments.length - 1];

  if (__DEV__) {
    logger.debug(
      'AUTH',
      'Onboarding - auth:',
      status,
      'isFirstTime:',
      isFirstTime,
      'needsUsername:',
      needsUsername,
      'needsContactEmail:',
      needsContactEmail,
      'screen:',
      currentScreen
    );
  }

  // Show loading while checking state
  if (!authInitialized || !onboardingInitialized) {
    if (__DEV__) {
      logger.debug('AUTH', 'Onboarding still initializing, showing loading');
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

  // If user is on username screen specifically
  if (currentScreen === 'username') {
    // Must be authenticated to set username
    if (status !== 'authenticated' || !token) {
      if (__DEV__) {
        logger.debug('AUTH', 'Username screen but not authenticated, redirecting to login');
      }
      return <Redirect href="/(auth)/login" />;
    }
    // If already has username, redirect to contact-email or main app
    if (!needsUsername) {
      if (needsContactEmail) {
        if (__DEV__) {
          logger.debug('AUTH', 'Has username but needs contact email, redirecting');
        }
        return <Redirect href="/(onboarding)/contact-email" />;
      }
      if (__DEV__) {
        logger.debug('AUTH', 'Already has username, redirecting to tabs');
      }
      return <Redirect href="/(tabs)/trips" />;
    }
    // User needs to set username - allow access
  }

  // If user is on contact-email screen specifically
  if (currentScreen === 'contact-email') {
    // Must be authenticated
    if (status !== 'authenticated' || !token) {
      if (__DEV__) {
        logger.debug('AUTH', 'Contact-email screen but not authenticated, redirecting to login');
      }
      return <Redirect href="/(auth)/login" />;
    }
    // If user still needs username, redirect there first
    if (needsUsername) {
      if (__DEV__) {
        logger.debug('AUTH', 'Contact-email screen but needs username first, redirecting');
      }
      return <Redirect href="/(onboarding)/username" />;
    }
    // If doesn't need contact email, go to main app
    if (!needsContactEmail) {
      if (__DEV__) {
        logger.debug('AUTH', 'Already has contact email, redirecting to tabs');
      }
      return <Redirect href="/(tabs)/trips" />;
    }
    // User needs to set contact email - allow access
  }

  // For welcome/permissions screens - if user has completed onboarding and is authenticated
  if (!isFirstTime && status === 'authenticated' && token && !needsUsername && !needsContactEmail) {
    // Only redirect if not on username or contact-email screens (which have their own logic above)
    if (currentScreen !== 'username' && currentScreen !== 'contact-email') {
      if (__DEV__) {
        logger.debug('AUTH', 'Onboarding complete and authenticated, redirecting to tabs');
      }
      return <Redirect href="/(tabs)/trips" />;
    }
  }

  // Render onboarding screens
  if (__DEV__) {
    logger.debug('AUTH', 'Rendering onboarding screens');
  }
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="welcome"
        options={{
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="permissions"
        options={{
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="username"
        options={{
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="contact-email"
        options={{
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
