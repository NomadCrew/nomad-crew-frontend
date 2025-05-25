import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/features/auth/store';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import Constants from 'expo-constants';

// Safe way to import useSegments
let useSegments: any;
try {
  useSegments = require('expo-router').useSegments;
} catch (error) {
  // Fallback if useSegments is not available
  useSegments = () => [''];
}

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
