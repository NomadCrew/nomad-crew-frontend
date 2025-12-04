// app/_layout.tsx (Temporary Test Screen)
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { SplashScreen } from 'expo-router';

export default function TestScreen() {
  // Hooks must be called unconditionally at the top level
  const { theme, mode, toggleColorScheme } = useTheme();

  // Hide splash screen ASAP
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
