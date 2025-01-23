import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { createTheme } from './create-theme';
import type { Theme, ThemeMode } from './types';

// Theme context type
interface ThemeContextType {
  theme: Theme;
  mode: 'light' | 'dark' | 'system';
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  toggleColorScheme: () => void;
}

// Create the theme context
const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = React.useState<ThemeMode>('system');
  
  const isDark = React.useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemColorScheme]);

  // Use the main createTheme function instead
  const theme = React.useMemo(() => createTheme({ isDark }), [isDark]);

  const toggleColorScheme = React.useCallback(() => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const value = React.useMemo(() => ({
    theme,
    mode,
    setMode,
    toggleColorScheme,
  }), [theme, mode, toggleColorScheme]);

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