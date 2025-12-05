import React from 'react';
import { View, Text } from 'react-native';
import { SplashScreen, Slot } from 'expo-router';
import AppInitializer from './AppInitializer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider, useCurrentAppTheme } from '@/src/theme/ThemeProvider';
import { createPaperTheme } from '@/src/theme/paper-adapter';
import AuthErrorBoundary from '@/components/AuthErrorBoundary';
import { AuthProvider } from '@/src/features/auth/components/AuthProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { OnboardingProvider } from '@/src/providers/OnboardingProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/src/lib/query-client';

console.log('[RootLayout] Rendering');

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
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  try {
    SplashScreen.hideAsync();
    return (
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider>
            <OnboardingProvider>
              <Providers>
                <AuthErrorBoundary>
                  <AppInitializer>
                    <ThemedRoot />
                  </AppInitializer>
                </AuthErrorBoundary>
              </Providers>
            </OnboardingProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    );
  } catch (e: any) {
    SplashScreen.hideAsync();
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error in RootLayout:</Text>
        <Text>{e.message}</Text>
      </View>
    );
  }
}
