    // app/index.tsx (Temporary Test Screen)
    import React from 'react';
    import { View, Text } from 'react-native';
    import { SplashScreen, Stack } from 'expo-router';
    import AppInitializer from './AppInitializer';
    import { GestureHandlerRootView } from 'react-native-gesture-handler';
    import { PaperProvider } from 'react-native-paper';
    import { ThemeProvider, useCurrentAppTheme } from '@/src/theme/ThemeProvider';
    import { createPaperTheme } from '@/src/theme/paper-adapter';
    import AuthErrorBoundary from '@/components/AuthErrorBoundary';
    import { AuthProvider } from '@/src/features/auth/components/AuthProvider';

    function Providers({ children }: { children: React.ReactNode }) {
      // Get the current semantic theme
      const theme = useCurrentAppTheme();
      // Memoize the Paper theme
      const paperTheme = React.useMemo(() => createPaperTheme(theme), [theme]);
      return <PaperProvider theme={paperTheme}>{children}</PaperProvider>;
    }

    export default function RootLayout() {
      try {
        SplashScreen.hideAsync();

        return (
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
              <Providers>
                <AuthErrorBoundary>
                  <AppInitializer>
                    <AuthProvider>
                      <Stack>
                        <Stack.Screen name="index" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                        <Stack.Screen name="trip/[id]" options={{ title: 'Trip Details' }} />
                        <Stack.Screen name="chat" options={{ headerShown: false }} />
                        <Stack.Screen name="invite/[id]" options={{ title: 'Join Trip' }} />
                      </Stack>
                    </AuthProvider>
                  </AppInitializer>
                </AuthErrorBoundary>
              </Providers>
            </ThemeProvider>
          </GestureHandlerRootView>
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