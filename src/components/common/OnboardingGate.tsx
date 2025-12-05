import React from 'react';
import { usePathname, useSegments } from 'expo-router';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/src/features/auth/store';
import { Redirect } from 'expo-router';

interface OnboardingGateProps {
  children: React.ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { isFirstTime, isInitialized } = useOnboarding();
  const { user, needsUsername, status } = useAuthStore();
  const pathname = usePathname();
  const segments = useSegments();

  // Show loading while initializing
  if (!isInitialized) {
    console.log('[OnboardingGate] Not initialized yet, showing loading');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Determine if the current route is part of the onboarding or auth groups
  const isInOnboardingGroup = segments[0] === '(onboarding)';
  const isInAuthGroup = segments[0] === '(auth)';
  const isOnUsernameScreen = pathname === '/(onboarding)/username' || pathname?.includes('/(onboarding)/username');

  // PRIORITY 1: Username gating - If authenticated user needs username, only allow username screen
  if (status === 'authenticated' && needsUsername) {
    if (!isOnUsernameScreen) {
      console.log(`[OnboardingGate] User needs username (status: ${status}, needsUsername: ${needsUsername}, path: ${pathname}). Redirecting to /username.`);
      return <Redirect href="/(onboarding)/username" />;
    }
    // If already on the username screen, render it
    console.log(`[OnboardingGate] User needs username and is on username screen, rendering children`);
    return <>{children}</>;
  }

  // PRIORITY 2: First-time user gating - Only block non-onboarding/auth routes
  // BUT: If user is authenticated, don't block based on first-time status alone
  // as the onboarding provider might be updating asynchronously
  if (isFirstTime && !isInOnboardingGroup && !isInAuthGroup && status !== 'authenticated') {
    console.log('[OnboardingGate] First-time user blocking rendering for path:', pathname, 'segments:', segments);
    // Return null to block rendering of protected routes
    return null;
  }

  console.log('[OnboardingGate] Rendering children for path:', pathname, 'segments:', segments);
  return <>{children}</>;
} 