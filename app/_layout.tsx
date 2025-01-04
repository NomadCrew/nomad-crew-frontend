import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider';
import { useAuthStore } from '@/src/store/useAuthStore';
import { OnboardingProvider } from '@/src/providers/OnboardingProvider';
import AuthErrorBoundary from '@/components/AuthErrorBoundary';
import { InitialLoadingScreen } from '@/components/InitialLoadingScreen';
import { useOnboarding } from '@/src/providers/OnboardingProvider';


function RouteGuard({ children }: { children: React.ReactNode }) {
  const segments: string[] = useSegments();
  const router = useRouter();
  const { token, isInitialized, loading, isVerifying } = useAuthStore();
  const { isFirstTime } = useOnboarding();

  const currentSegment = segments[0];
  const inAuthGroup = currentSegment === '(auth)';
  const inOnboardingGroup = currentSegment === '(onboarding)';

  // Memoize the routing state to prevent unnecessary re-renders
  const routingState = useMemo(() => ({
    shouldShowVerification: isVerifying && !segments.includes('verify-email'),
    shouldShowOnboarding: isFirstTime && token && !inOnboardingGroup && !isVerifying,
    shouldRedirectToLogin: !token && !inAuthGroup && !inOnboardingGroup && !isVerifying,
    shouldRedirectToTabs: token && !isVerifying && (inAuthGroup || inOnboardingGroup),
  }), [isFirstTime, token, inAuthGroup, inOnboardingGroup, isVerifying, segments]);
  
  useEffect(() => {
    console.log('[RouteGuard] Navigation Triggers:', {
      shouldRedirectToLogin: !token && !inAuthGroup && !inOnboardingGroup && !isVerifying,
      shouldShowOnboarding: isFirstTime && !inOnboardingGroup && !isVerifying,
      token,
      inAuthGroup,
      inOnboardingGroup,
      isVerifying,
      isFirstTime,
      currentSegment
    });
    if (!isInitialized || loading) return;

    if (!token) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }
  
    if (routingState.shouldShowOnboarding) {
      router.replace('/(onboarding)/welcome');
    } else if (routingState.shouldRedirectToTabs) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, loading, routingState, router]);

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
        await initialize();
        
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
    <OnboardingProvider>
      <ThemeProvider>
        <AuthErrorBoundary>
          <RootLayoutNav />
        </AuthErrorBoundary>
      </ThemeProvider>
    </OnboardingProvider>
  );
}