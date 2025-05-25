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

  // Only block rendering if it's the first time and not in onboarding or auth groups
  if (isFirstTime && !isInOnboardingGroup && !isInAuthGroup) {
    console.log('[OnboardingGate] Blocking rendering for path:', pathname, 'segments:', segments);
    // Return null to block rendering of protected routes
    return null;
  }

  const isOnUsernameScreen = pathname === '/(onboarding)/username' || pathname?.includes('/(onboarding)/username');

  // Username gating: If needsUsername, only allow the username screen to render
  if (status === 'authenticated' && needsUsername) {
    if (!isOnUsernameScreen) {
      console.log(`[OnboardingGate] User needs username (status: ${status}, needsUsername: ${needsUsername}, path: ${pathname}). Redirecting to /username.`);
      return <Redirect href="/(onboarding)/username" />;
    }
    // If already on the username screen, render only the username screen (children)
    return <>{children}</>;
  }

  console.log('[OnboardingGate] Rendering children for path:', pathname, 'segments:', segments);
  return <>{children}</>;
} 