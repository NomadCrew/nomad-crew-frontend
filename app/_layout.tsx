import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider';
import { useAuthStore } from '@/src/store/useAuthStore';
import AuthErrorBoundary from '@/components/AuthErrorBoundary';
import { InitialLoadingScreen } from '@/components/InitialLoadingScreen';

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { token, isInitialized, loading } = useAuthStore();

  useEffect(() => {
    console.log('[Route] Auth state:', { 
      isInitialized, 
      hasToken: !!token,
      loading,
      currentSegment: segments[0]
    });

    if (!isInitialized) {
      console.log('[Route] Waiting for initialization');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    console.log('[Route] Navigation check:', { hasToken: !!token, inAuthGroup });

    if (!token && !inAuthGroup) {
      console.log('[Route] Redirecting to login');
      router.replace('/login');
    } else if (token && inAuthGroup) {
      console.log('[Route] Redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [token, segments, isInitialized, loading]);

  return !isInitialized;
}

function RootLayoutNav() {
  const isLoading = useProtectedRoute();
  const { mode } = useTheme();

  if (isLoading) {
    return <InitialLoadingScreen />;
  }

  return (
    <NavigationThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  console.log('RootLayout rendering');
  const { initialize } = useAuthStore();
  
  const [fontsLoaded, fontError] = useFonts({
    'Inter': require('../assets/fonts/Inter/Inter-VariableFont_opsz,wght.ttf'),
    'Inter-Italic': require('../assets/fonts/Inter/Inter-Italic-VariableFont_opsz,wght.ttf'),
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Manrope': require('../assets/fonts/Manrope/Manrope-VariableFont_wght.ttf'),
  });

  // Combined initialization effect
  useEffect(() => {
    const initApp = async () => {
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
    };

    initApp();
  }, [initialize, fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    console.log('Fonts not loaded yet');
    return null;
  }

  console.log('Rendering app with providers');
  return (
    <ThemeProvider>
      <AuthErrorBoundary>
        <RootLayoutNav />
      </AuthErrorBoundary>
    </ThemeProvider>
  );
}
