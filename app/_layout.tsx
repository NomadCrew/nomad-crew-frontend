import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider';
import { useAuthStore } from '@/src/store/useAuthStore';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { theme, mode } = useTheme();
  
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
  const [fontsLoaded, fontError] = useFonts({
    'Inter': require('../assets/fonts/Inter/Inter-VariableFont_opsz,wght.ttf'),
    'Inter-Italic': require('../assets/fonts/Inter/Inter-Italic-VariableFont_opsz,wght.ttf'),
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { restoreToken, isInitialized } = useAuthStore();

  useEffect(() => {
    restoreToken();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isInitialized]);

  if (!fontsLoaded && !fontError && !isInitialized) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}