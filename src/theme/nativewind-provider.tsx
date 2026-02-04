import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { useAppTheme } from './ThemeProvider';

interface NativeWindThemeContextType {
  colorScheme: 'light' | 'dark';
  toggleColorScheme: () => void;
}

const NativeWindThemeContext = createContext<NativeWindThemeContextType | null>(null);

export function NativeWindThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode, toggleColorScheme } = useAppTheme();
  const systemColorScheme = useColorScheme();
  
  const colorScheme = React.useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme || 'light';
    }
    return mode;
  }, [mode, systemColorScheme]);
  
  return (
    <NativeWindThemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
      <div className={colorScheme}>
        {children}
      </div>
    </NativeWindThemeContext.Provider>
  );
}

export function useNativeWindTheme() {
  const context = useContext(NativeWindThemeContext);
  if (!context) {
    throw new Error('useNativeWindTheme must be used within NativeWindThemeProvider');
  }
  return context;
}