import React from 'react';
import { Redirect } from 'expo-router';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { useAuthStore } from '@/src/features/auth/store';
import { View, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

console.log('[Index] File loaded');

export default function Index() {
  const { theme } = useAppTheme();
  const { status, token, isInitialized: authInitialized, needsUsername } = useAuthStore();
  const { isFirstTime, isInitialized: onboardingInitialized } = useOnboarding();

  console.log(
    '[Index] Rendering - auth:',
    status,
    'isFirstTime:',
    isFirstTime,
    'needsUsername:',
    needsUsername
  );

  // Show loading while checking state
  if (!authInitialized || !onboardingInitialized) {
    console.log('[Index] Still initializing, showing loading');
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
    console.log('[Index] First time user, redirecting to onboarding');
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // If not authenticated, redirect to login
  if (status !== 'authenticated' || !token) {
    console.log('[Index] Not authenticated, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  // If user needs to set username, redirect to username screen
  if (needsUsername) {
    console.log('[Index] User needs username, redirecting to username screen');
    return <Redirect href="/(onboarding)/username" />;
  }

  // User is fully authenticated - redirect to main app
  console.log('[Index] Authenticated, redirecting to tabs');
  return <Redirect href="/(tabs)/trips" />;
}
