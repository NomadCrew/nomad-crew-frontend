    // app/index.tsx (Temporary Test Screen)
    import React from 'react';
    import { View, Text, Button } from 'react-native';
    import { useTheme } from '@/src/theme/ThemeProvider';
    import { SplashScreen, Stack } from 'expo-router';
    import AppInitializer from './AppInitializer';
    import { GestureHandlerRootView } from 'react-native-gesture-handler';
    import { PaperProvider } from 'react-native-paper';
    import { ThemeProvider as CustomThemeProvider } from '@/src/theme/ThemeProvider';
    import AuthErrorBoundary from '@/components/AuthErrorBoundary';

    export default function RootLayout() {
      const { theme, mode, toggleColorScheme } = useTheme();

      try {
        SplashScreen.hideAsync();

        return (
          <AuthErrorBoundary>
            <AppInitializer>
              <CustomThemeProvider>
                <PaperProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <Stack>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                      <Stack.Screen name="chat/[tripId]" options={{ title: 'Chat' }} />
                      <Stack.Screen name="trip/[id]" options={{ title: 'Trip Details' }} />
                      <Stack.Screen name="invite/[id]" options={{ title: 'Join Trip' }} />
                    </Stack>
                  </GestureHandlerRootView>
                </PaperProvider>
              </CustomThemeProvider>
            </AppInitializer>
          </AuthErrorBoundary>
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