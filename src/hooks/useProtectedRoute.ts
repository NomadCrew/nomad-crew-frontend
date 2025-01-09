import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useOnboarding } from '@/src/providers/OnboardingProvider';

export default function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments();
  const { token, isInitialized, isVerifying } = useAuthStore();
  const { isFirstTime } = useOnboarding();
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastNavigationRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isInitialized) return;

    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === '(auth)';
    const inOnboardingGroup = currentSegment === '(onboarding)';

    let targetRoute: string | null = null;
    if (isVerifying) {
      targetRoute = '/(auth)/verify-email';
    } else if (isFirstTime && !inOnboardingGroup && !isVerifying) {
      targetRoute = '/(onboarding)/welcome';
    } else if (!token && !inAuthGroup && !inOnboardingGroup) {
      targetRoute = '/(auth)/login';
    } else if (token && inAuthGroup) {
      targetRoute = '/(tabs)';
    }

    if (targetRoute && targetRoute !== lastNavigationRef.current) {
      navigationTimeoutRef.current = setTimeout(() => {
        lastNavigationRef.current = targetRoute;
        router.replace(targetRoute as any);
      }, 100);
    }

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [segments, token, isInitialized, isFirstTime, isVerifying, router]);
}
