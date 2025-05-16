    // app/_layout.tsx (Temporary Minimal Version for Testing)
    import React from 'react';
    import { Stack, SplashScreen } from 'expo-router';
    import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider'; // Assuming this path is correct
    import { View, Text, Button } from 'react-native';
    import { PaperProvider } from 'react-native-paper'; // Keep PaperProvider as useTheme might depend on it via extendTheme

    // Keep splash screen visible initially
    SplashScreen.preventAutoHideAsync();

    function TestScreen() {
      try {
        const { theme, mode, toggleColorScheme } = useTheme();
        // If we reach here, useTheme worked.
        SplashScreen.hideAsync(); // Hide splash if theme is accessible
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background.default }}>
            <Text style={{ color: theme.colors.content.primary }}>Theme mode: {mode}</Text>
            <Text style={{ color: theme.colors.content.primary }}>Test Screen: Theme loaded!</Text>
            <Button title="Toggle Theme" onPress={toggleColorScheme} />
          </View>
        );
      } catch (e: any) {
        // If useTheme fails, this will be caught.
        SplashScreen.hideAsync(); // Hide splash even on error to see the message
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Error using theme in TestScreen:</Text>
            <Text>{e.message}</Text>
          </View>
        );
      }
    }

    export default function MinimalRootLayout() {
      return (
        <PaperProvider> {/* Keep PaperProvider if your custom theme relies on it */}
          <ThemeProvider>
            <Stack>
              <Stack.Screen name="index" component={TestScreen} options={{ title: 'Test' }} />
              {/* Add other essential screens if 'index' isn't your initial route, or point to (tabs) */}
              {/* <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> */}
            </Stack>
          </ThemeProvider>
        </PaperProvider>
      );
    }