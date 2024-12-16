import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { createSemanticColors } from './foundations/colors';
import { createSemanticElevation} from './foundations/elevation';
import { createSemanticSpacing} from './foundations/spacing';
import { createTypography} from './foundations/typography';
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

// Create theme based on color scheme
function createTheme(isDark: boolean): Theme {
  return {
    colors: createSemanticColors(isDark),
    typography: createTypography('Inter'),
    spacing: createSemanticSpacing(),
    elevation: createSemanticElevation(isDark),
    components: {}, // Empty for now, will be expanded later
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = React.useState<ThemeMode>('system');
  
  const isDark = React.useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemColorScheme]);

  const theme = React.useMemo(() => createTheme(isDark), [isDark]);

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