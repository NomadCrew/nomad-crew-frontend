import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/src/store/useAuthStore';

export default function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments();
  const { token, isInitialized } = useAuthStore();

  useEffect(() => {
    const isAuthRoute = segments[0] === '(auth)';
    if (!isInitialized) return;

    if (!token && !isAuthRoute) {
      router.replace('/(auth)/login');
    } else if (token && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [segments, token, isInitialized, router]);
}
