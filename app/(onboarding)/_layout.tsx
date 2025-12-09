import React from 'react';
import { Stack, Redirect, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/src/features/auth/store';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { useAppTheme } from '@/src/theme/ThemeProvider';

console.log('[OnboardingLayout] File loaded');

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

  console.log(
    '[OnboardingLayout] Rendering - auth:',
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
    // If already has username, redirect to contact-email or main app
    if (!needsUsername) {
      if (needsContactEmail) {
        console.log(
          '[OnboardingLayout] Has username but needs contact email, redirecting to contact-email'
        );
        return <Redirect href="/(onboarding)/contact-email" />;
      }
      console.log('[OnboardingLayout] Already has username, redirecting to tabs');
      return <Redirect href="/(tabs)/trips" />;
    }
    // User needs to set username - allow access
  }

  // If user is on contact-email screen specifically
  if (currentScreen === 'contact-email') {
    // Must be authenticated
    if (status !== 'authenticated' || !token) {
      console.log(
        '[OnboardingLayout] Contact-email screen but not authenticated, redirecting to login'
      );
      return <Redirect href="/(auth)/login" />;
    }
    // If user still needs username, redirect there first
    if (needsUsername) {
      console.log('[OnboardingLayout] Contact-email screen but needs username first, redirecting');
      return <Redirect href="/(onboarding)/username" />;
    }
    // If doesn't need contact email, go to main app
    if (!needsContactEmail) {
      console.log('[OnboardingLayout] Already has contact email, redirecting to tabs');
      return <Redirect href="/(tabs)/trips" />;
    }
    // User needs to set contact email - allow access
  }

  // For welcome/permissions screens - if user has completed onboarding and is authenticated
  if (!isFirstTime && status === 'authenticated' && token && !needsUsername && !needsContactEmail) {
    // Only redirect if not on username or contact-email screens (which have their own logic above)
    if (currentScreen !== 'username' && currentScreen !== 'contact-email') {
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
