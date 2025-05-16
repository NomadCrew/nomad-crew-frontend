    // app/index.tsx (Temporary Test Screen)
    import React from 'react';
    import { View, Text, Button } from 'react-native';
    import { useTheme } from '@/src/theme/ThemeProvider';
    import { SplashScreen } from 'expo-router';

    export default function TestScreen() {
      try {
        // Hide splash screen ASAP, but after potential theme access
        SplashScreen.hideAsync(); 
        const { theme, mode, toggleColorScheme } = useTheme();
        
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background.default }}>
            <Text style={{ color: theme.colors.content.primary }}>Theme mode: {mode}</Text>
            <Text style={{ color: theme.colors.content.primary }}>Test Screen: Theme loaded!</Text>
            <Button title="Toggle Theme" onPress={toggleColorScheme} />
          </View>
        );
      } catch (e: any) {
        SplashScreen.hideAsync(); // Ensure splash is hidden to see error
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Error using theme in TestScreen (app/index.tsx):</Text>
            <Text>{e.message}</Text>
          </View>
        );
      }
    }