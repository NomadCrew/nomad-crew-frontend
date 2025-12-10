import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Home, MapPin, Bell, User } from 'lucide-react-native';
import { useAuthStore } from '@/src/features/auth/store';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { logger } from '@/src/utils/logger';

/**
 * Render the app's tab-based layout and route users to onboarding or authentication flows as required.
 *
 * Shows a centered loading indicator while authentication or onboarding state is initializing.
 * Redirects first-time users to the onboarding welcome flow, unauthenticated users to the login flow,
 * and users who still need a username to the onboarding username screen. When the user is authenticated
 * and onboarded, renders the main tab navigator.
 *
 * @returns A React element that either displays a loading indicator, performs a redirect to an onboarding/login route, or renders the main Tabs navigator for authenticated users.
 */
export default function TabsLayout() {
  const { theme } = useAppTheme();
  const { status, token, isInitialized: authInitialized, needsUsername } = useAuthStore();
  const { isFirstTime, isInitialized: onboardingInitialized } = useOnboarding();

  if (__DEV__) {
    logger.debug(
      'AUTH',
      'Tabs - auth:',
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
      logger.debug('AUTH', 'Tabs still initializing, showing loading');
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

  // User is authenticated and onboarded - render tabs
  if (__DEV__) {
    logger.debug('AUTH', 'User authenticated, rendering tabs');
  }
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary.main,
        tabBarInactiveTintColor: theme.colors.content.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.background.default,
          borderTopColor: theme.colors.border?.default || '#E5E7EB',
        },
        headerStyle: {
          backgroundColor: theme.colors.background.default,
        },
        headerTintColor: theme.colors.content.primary,
      }}
    >
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="location"
        options={{
          title: 'Location',
          tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
