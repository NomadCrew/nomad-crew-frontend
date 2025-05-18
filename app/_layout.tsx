    // app/index.tsx (Temporary Test Screen)
    import React from 'react';
    import { View, Text } from 'react-native';
    import { SplashScreen, Stack } from 'expo-router';
    import AppInitializer from './AppInitializer';
    import { GestureHandlerRootView } from 'react-native-gesture-handler';
    import { PaperProvider } from 'react-native-paper';
    import { ThemeProvider } from '@/src/theme/ThemeProvider';
    import AuthErrorBoundary from '@/components/AuthErrorBoundary';
    import { AuthProvider } from '@/src/features/auth/components/AuthProvider';

    export default function RootLayout() {
      try {
        SplashScreen.hideAsync();

        return (
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
              <PaperProvider>
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
              </PaperProvider>
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