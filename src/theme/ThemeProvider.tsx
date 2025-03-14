import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { createTheme } from './create-theme';
import type { Theme, ThemeMode } from './types';
import { extendTheme } from './theme-compatibility';

// Theme context type with extended theme
interface ThemeContextType {
  theme: ReturnType<typeof extendTheme>;
  mode: 'light' | 'dark' | 'system';
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  toggleColorScheme: () => void;
  isThemeLoaded: boolean;
}

// Create the theme context
const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = React.useState<ThemeMode>('system');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  
  const isDark = React.useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemColorScheme]);
  
  // Create the base theme and then extend it with our compatibility layer
  const baseTheme = React.useMemo(() => createTheme({ isDark }), [isDark]);
  const theme = React.useMemo(() => extendTheme(baseTheme), [baseTheme]);
  
  const toggleColorScheme = React.useCallback(() => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);
  
  // Set theme as loaded after a short delay to ensure it's fully initialized
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsThemeLoaded(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  const value = React.useMemo(() => ({
    theme,
    mode,
    setMode,
    toggleColorScheme,
    isThemeLoaded,
  }), [theme, mode, toggleColorScheme, isThemeLoaded]);
  
  // Show simple loading view while theme is initializing
  if (!isThemeLoaded) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF' 
      }}>
        <ActivityIndicator size="large" color="#F46315" />
      </View>
    );
  }
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}