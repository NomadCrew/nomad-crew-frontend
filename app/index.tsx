// app/index.tsx (Temporary Minimal Version for Testing)
import React from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider';
import { View, Text, Button } from 'react-native';
import { PaperProvider } from 'react-native-paper';

// Keep splash screen visible initially
SplashScreen.preventAutoHideAsync();

function TestScreen() {
  // Hooks must be called unconditionally at the top level
  const { theme, mode, toggleColorScheme } = useTheme();

  // Hide splash if theme is accessible
  React.useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background.default }}>
      <Text style={{ color: theme.colors.content.primary }}>Theme mode: {mode}</Text>
      <Text style={{ color: theme.colors.content.primary }}>Test Screen: Theme loaded!</Text>
      <Button title="Toggle Theme" onPress={toggleColorScheme} />
    </View>
  );
}

export default function MinimalRootLayout() {
  return (
    <PaperProvider>
      <ThemeProvider>
        <Stack>
          <Stack.Screen name="index" component={TestScreen} options={{ title: 'Test' }} />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
