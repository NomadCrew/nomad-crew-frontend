import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { createSemanticColors } from './foundations/colors';

// Theme interface
interface Theme {
  colors: ReturnType<typeof createSemanticColors>;
}

// Theme context type
interface ThemeContextType {
  theme: Theme;
  mode: 'light' | 'dark' | 'system';
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  toggleColorScheme: () => void;
}

// Create the theme context
const ThemeContext = createContext<ThemeContextType | null>(null);

// Create theme based on color scheme
function createTheme(isDark: boolean): Theme {
  return {
    colors: createSemanticColors(isDark),
  };
}

// Provider component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = React.useState<'light' | 'dark' | 'system'>('system');
  
  // Determine if dark mode based on mode setting
  const isDark = React.useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemColorScheme]);

  // Create theme based on dark mode setting
  const theme = React.useMemo(() => createTheme(isDark), [isDark]);

  // Toggle between light and dark
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

// Hook for using theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}