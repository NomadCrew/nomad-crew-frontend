import { create } from 'zustand';
import { createTheme } from './create-theme';
import type { Theme, ThemeMode } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  mode: ThemeMode;
  theme: Theme;
  isInitialized: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleColorScheme: () => Promise<void>;
  initialize: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@nomadcrew/theme-mode';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  theme: createTheme({ isDark: false }),
  isInitialized: false,

  setMode: async (newMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
      const isDark = newMode === 'dark' || 
        (newMode === 'system' && Appearance.getColorScheme() === 'dark');
      
      set({
        mode: newMode,
        theme: createTheme({ isDark })
      });
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  },

  toggleColorScheme: async () => {
    const { mode, setMode } = get();
    await setMode(mode === 'dark' ? 'light' : 'dark');
  },

  initialize: async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        const isDark = savedMode === 'dark' || 
          (savedMode === 'system' && Appearance.getColorScheme() === 'dark');
        
        set({
          mode: savedMode as ThemeMode,
          theme: createTheme({ isDark }),
          isInitialized: true
        });
      } else {
        set({ isInitialized: true });
      }
    } catch (error) {
      console.error('Failed to load theme mode:', error);
      set({ isInitialized: true });
    }
  },
}));