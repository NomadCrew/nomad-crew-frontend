import React from 'react';
import { Stack, Redirect, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/src/features/auth/store';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { useAppTheme } from '@/src/theme/ThemeProvider';

console.log('[OnboardingLayout] File loaded');

export default function OnboardingLayout() {
  const { theme } = useAppTheme();
  const { status, token, isInitialized: authInitialized, needsUsername } = useAuthStore();
  const { isFirstTime, isInitialized: onboardingInitialized } = useOnboarding();
  const segments = useSegments();

  // Get current onboarding screen from segments
  const currentScreen = segments[segments.length - 1];

  console.log(
    '[OnboardingLayout] Rendering - auth:',
    status,
    'isFirstTime:',
    isFirstTime,
    'needsUsername:',
    needsUsername,
    'screen:',
    currentScreen
  );

  // Show loading while checking state
  if (!authInitialized || !onboardingInitialized) {
    console.log('[OnboardingLayout] Still initializing, showing loading');
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
      console.log('[OnboardingLayout] Username screen but not authenticated, redirecting to login');
      return <Redirect href="/(auth)/login" />;
    }
    // If already has username, redirect to main app
    if (!needsUsername) {
      console.log('[OnboardingLayout] Already has username, redirecting to tabs');
      return <Redirect href="/(tabs)/trips" />;
    }
    // User needs to set username - allow access
  }

  // For welcome/permissions screens - if user has completed onboarding and is authenticated
  if (!isFirstTime && status === 'authenticated' && token && !needsUsername) {
    // Only redirect if not on username screen (which has its own logic above)
    if (currentScreen !== 'username') {
      console.log('[OnboardingLayout] Onboarding complete and authenticated, redirecting to tabs');
      return <Redirect href="/(tabs)/trips" />;
    }
  }

  // Render onboarding screens
  console.log('[OnboardingLayout] Rendering onboarding screens');
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
    </Stack>
  );
}
