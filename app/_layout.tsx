import React from 'react';
import { View, Text } from 'react-native';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import AppInitializer from './AppInitializer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider, useCurrentAppTheme } from '@/src/theme/ThemeProvider';
import { createPaperTheme } from '@/src/theme/paper-adapter';
import AuthErrorBoundary from '@/components/AuthErrorBoundary';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { OnboardingProvider } from '@/src/providers/OnboardingProvider';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, queryPersister } from '@/src/lib/query-client';

// CRITICAL: Call preventAutoHideAsync at global scope, NOT inside component
// This prevents the splash screen from auto-hiding before we're ready
SplashScreen.preventAutoHideAsync().catch(console.warn);

console.log('[RootLayout] File loaded');

function Providers({ children }: { children: React.ReactNode }) {
  // Get the current semantic theme
  const theme = useCurrentAppTheme();
  // Memoize the Paper theme
  const paperTheme = React.useMemo(() => createPaperTheme(theme), [theme]);
  return <PaperProvider theme={paperTheme}>{children}</PaperProvider>;
}

// Move theme-dependent logic here
function ThemedRoot() {
  const theme = useCurrentAppTheme();
  const statusBarStyle = theme.dark ? 'light' : 'dark';
  const statusBarBg = theme.colors.primary.main;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: statusBarBg }}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={statusBarStyle} backgroundColor={statusBarBg} translucent={false} />
      {/* Slot ALWAYS renders - never block it conditionally in root layout */}
      <Slot />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  console.log('[RootLayout] Rendering');

  try {
    // Root layout ALWAYS renders <Slot /> - auth redirects happen in nested layouts
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: queryPersister }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider>
            <OnboardingProvider>
              <Providers>
                <AuthErrorBoundary>
                  {/* AppInitializer handles fonts, auth init, and splash screen hiding */}
                  <AppInitializer>
                    <ThemedRoot />
                  </AppInitializer>
                </AuthErrorBoundary>
              </Providers>
            </OnboardingProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </PersistQueryClientProvider>
    );
  } catch (e: any) {
    // On error, hide splash and show error message
    SplashScreen.hideAsync().catch(console.warn);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error in RootLayout:</Text>
        <Text>{e.message}</Text>
      </View>
    );
  }
}
