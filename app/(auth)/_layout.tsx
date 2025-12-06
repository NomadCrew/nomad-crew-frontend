import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/src/features/auth/store';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { useAppTheme } from '@/src/theme/ThemeProvider';

console.log('[AuthLayout] File loaded');

export default function AuthLayout() {
  const { theme } = useAppTheme();
  const { status, token, isInitialized: authInitialized, needsUsername } = useAuthStore();
  const { isFirstTime, isInitialized: onboardingInitialized } = useOnboarding();

  console.log(
    '[AuthLayout] Rendering - auth:',
    status,
    'isFirstTime:',
    isFirstTime,
    'needsUsername:',
    needsUsername
  );

  // Show loading while checking auth state
  if (!authInitialized || !onboardingInitialized) {
    console.log('[AuthLayout] Still initializing, showing loading');
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
    console.log('[AuthLayout] First time user, redirecting to onboarding');
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // If already authenticated, redirect to appropriate destination
  if (status === 'authenticated' && token) {
    // Check if user needs to complete username setup
    if (needsUsername) {
      console.log('[AuthLayout] Authenticated but needs username, redirecting to username screen');
      return <Redirect href="/(onboarding)/username" />;
    }
    // Fully authenticated - redirect to main app
    console.log('[AuthLayout] Already authenticated, redirecting to tabs');
    return <Redirect href="/(tabs)/trips" />;
  }

  // User is not authenticated - render auth screens
  console.log('[AuthLayout] Not authenticated, rendering auth screens');
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
