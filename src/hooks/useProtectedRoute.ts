import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useOnboarding } from '@/src/providers/OnboardingProvider';

export default function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments();
  const { token, isInitialized } = useAuthStore();
  const { isFirstTime } = useOnboarding();
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing navigation timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Don't process navigation until initialization is complete
    if (!isInitialized) {
      return;
    }

    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === '(auth)';
    const inOnboardingGroup = currentSegment === '(onboarding)';

    // Debounce navigation changes
    navigationTimeoutRef.current = setTimeout(() => {
      console.log('[Navigation] Processing route change', {
        currentSegment,
        hasToken: !!token,
        isFirstTime,
        inAuthGroup,
        inOnboardingGroup
      });

      // First-time users should see onboarding
      if (isFirstTime && !inOnboardingGroup) {
        router.replace('/(onboarding)/welcome');
        return;
      }

      // Unauthenticated users should be in auth flow
      if (!token && !inAuthGroup && !inOnboardingGroup) {
        router.replace('/(auth)/login');
        return;
      }

      // Authenticated users shouldn't be in auth flow
      if (token && inAuthGroup) {
        router.replace('/(tabs)');
        return;
      }
    }, 100); // Small delay to batch rapid navigation changes

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [segments, token, isInitialized, isFirstTime, router]);
}