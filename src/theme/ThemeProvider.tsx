import React, { useEffect } from 'react';
import { Appearance } from 'react-native';
import { useThemeStore } from './theme-store';
import { createTheme } from './create-theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode, initialize, setMode } = useThemeStore();

  // Initialize theme on mount
  useEffect(() => {
    initialize();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (mode === 'system') {
        const isDark = colorScheme === 'dark';
        useThemeStore.setState({ theme: createTheme({ isDark }) });
      }
    });

    return () => subscription.remove();
  }, [mode]);

  // Wait for initialization
  if (!useThemeStore.getState().isInitialized) {
    return null; // Or loading indicator
  }

  return children;
}

// Keep the convenience hooks
export function useTheme() {
  const { theme, mode, setMode, toggleColorScheme } = useThemeStore();
  return { theme, mode, setMode, toggleColorScheme };
}

export function useThemeMode() {
  const { mode, setMode, toggleColorScheme } = useThemeStore();
  return { mode, setMode, toggleColorScheme };
}

export function useCurrentTheme() {
  return useThemeStore(state => state.theme);
}