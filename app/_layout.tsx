import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import RNEventSource from 'react-native-sse';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider';
import { useAuthStore } from '@/src/store/useAuthStore';
import { OnboardingProvider } from '@/src/providers/OnboardingProvider';
import AuthErrorBoundary from '@/components/AuthErrorBoundary';
import { InitialLoadingScreen } from '@/components/InitialLoadingScreen';
import { supabase } from '@/src/auth/supabaseClient';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import AppInitializer from './AppInitializer';
import 'react-native-get-random-values'

if (!global.EventSource) {
  // @ts-ignore - React Native SSE polyfill
  global.EventSource = RNEventSource;
}

function RouteGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const { token, isInitialized, loading, isVerifying } = useAuthStore();
  const { isFirstTime } = useOnboarding();
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastNavigationRef = useRef<string | null>(null);

  const currentSegment = segments[0];
  const inAuthGroup = currentSegment === '(auth)';
  const inOnboardingGroup = currentSegment === '(onboarding)';

  useEffect(() => {
    const debugSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('[Auth Debug] Initial session check:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        error: error?.message,
      });
    };
    debugSession();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    let targetRoute: string | null = null;
    if (isVerifying) {
      targetRoute = '/(auth)/verify-email';
    } else if (isFirstTime && !inOnboardingGroup) {
      targetRoute = '/(onboarding)/welcome';
    } else if (!token && !inAuthGroup && !isFirstTime) {
      targetRoute = '/(auth)/login';
    } else if (token && (inAuthGroup || inOnboardingGroup)) {
      targetRoute = '/(tabs)';
    }

    console.log('Navigation State:', {
      currentSegment,
      isFirstTime,
      hasToken: !!token,
      isVerifying,
      inAuthGroup,
      inOnboardingGroup,
      targetRoute
    });

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
  }, [segments, token, isInitialized, isFirstTime, isVerifying, router, inAuthGroup, inOnboardingGroup]);

  return children;
}

function RootLayoutNav() {
  const { theme, mode } = useTheme();
  const { isInitialized } = useAuthStore();
  
  if (!isInitialized) {
    return <InitialLoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
        <RouteGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {/* Add this new Stack.Screen */}
            <Stack.Screen 
              name="trip/[id]" 
              options={{ 
                headerShown: false,
                presentation: 'card'
              }} 
            />
          </Stack>
        </RouteGuard>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <PaperProvider>
      <OnboardingProvider>
        <ThemeProvider>
          <AuthErrorBoundary>
            <AppInitializer>
              <RootLayoutNav />
            </AppInitializer>
          </AuthErrorBoundary>
        </ThemeProvider>
      </OnboardingProvider>
    </PaperProvider>
  );
}