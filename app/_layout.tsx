import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider';
import { useAuthStore } from '@/src/store/useAuthStore';
import { OnboardingProvider } from '@/src/providers/OnboardingProvider';
import AuthErrorBoundary from '@/components/AuthErrorBoundary';
import { InitialLoadingScreen } from '@/components/InitialLoadingScreen';
import { supabase } from '@/src/auth/supabaseClient';
import { useOnboarding } from '@/src/providers/OnboardingProvider';

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
    <NavigationThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <RouteGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </RouteGuard>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const { initialize } = useAuthStore();
  
  const [fontsLoaded, fontError] = useFonts({
    'Inter': require('../assets/fonts/Inter/Inter-VariableFont_opsz,wght.ttf'),
    'Inter-Italic': require('../assets/fonts/Inter/Inter-Italic-VariableFont_opsz,wght.ttf'),
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Manrope': require('../assets/fonts/Manrope/Manrope-VariableFont_wght.ttf'),
  });

  useEffect(() => {
    async function initApp() {
      try {
        console.log('Starting auth initialization');
        await initialize();  // Grabs or refreshes session
        if (fontsLoaded || fontError) {
          console.log('Hiding splash screen');
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    }

    initApp();
  }, [initialize, fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    console.log('Fonts not loaded yet');
    return null;
  }

  return (
    <PaperProvider>
      <OnboardingProvider>
        <ThemeProvider>
          <AuthErrorBoundary>
            <RootLayoutNav />
          </AuthErrorBoundary>
        </ThemeProvider>
      </OnboardingProvider>
    </PaperProvider>
  );
}
