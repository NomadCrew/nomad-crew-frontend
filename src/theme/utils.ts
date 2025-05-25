import { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useAppTheme } from './ThemeProvider';
import { logger } from '../utils/logger';
import type { Theme } from './types';

/**
 * Safe theme property access with fallbacks
 */
export const safeThemeAccess = {
  spacing: {
    get: (theme: Theme, path: string, fallback: number = 16): number => {
      try {
        const keys = path.split('.');
        let value: any = theme.spacing;
        
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            console.warn(`[Theme] Missing spacing property: theme.spacing.${path}, using fallback: ${fallback}`);
            return fallback;
          }
        }
        
        return typeof value === 'number' ? value : fallback;
      } catch (error) {
        console.warn(`[Theme] Error accessing spacing property: theme.spacing.${path}`, error);
        return fallback;
      }
    },
  },
  
  colors: {
    get: (theme: Theme, path: string, fallback: string = '#000000'): string => {
      try {
        const keys = path.split('.');
        let value: any = theme.colors;
        
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            console.warn(`[Theme] Missing color property: theme.colors.${path}, using fallback: ${fallback}`);
            return fallback;
          }
        }
        
        return typeof value === 'string' ? value : fallback;
      } catch (error) {
        console.warn(`[Theme] Error accessing color property: theme.colors.${path}`, error);
        return fallback;
      }
    },
  },
  
  borderRadius: {
    get: (theme: Theme, size: string, fallback: number = 8): number => {
      try {
        if (theme.borderRadius && size in theme.borderRadius) {
          return theme.borderRadius[size as keyof typeof theme.borderRadius];
        }
        console.warn(`[Theme] Missing borderRadius property: theme.borderRadius.${size}, using fallback: ${fallback}`);
        return fallback;
      } catch (error) {
        console.warn(`[Theme] Error accessing borderRadius property: theme.borderRadius.${size}`, error);
        return fallback;
      }
    },
  },
};

/**
 * Enhanced useThemedStyles hook with better error handling
 */
export function useThemedStyles<T extends Record<string, any>>(
  createStyles: (theme: Theme, safeAccess: typeof safeThemeAccess) => T
): T {
  const { theme } = useAppTheme();
  
  return useMemo(() => {
    try {
      return createStyles(theme, safeThemeAccess);
    } catch (error) {
      console.error('[Theme] Error creating styles:', error);
      // Return empty styles object as fallback
      return {} as T;
    }
  }, [theme, createStyles]);
}

/**
 * Quick access helpers for common theme properties
 */
export const createThemeHelpers = (theme: Theme) => ({
  // Spacing helpers
  spacing: {
    xs: safeThemeAccess.spacing.get(theme, 'xs', 4),
    sm: safeThemeAccess.spacing.get(theme, 'sm', 8),
    md: safeThemeAccess.spacing.get(theme, 'md', 16),
    lg: safeThemeAccess.spacing.get(theme, 'lg', 24),
    xl: safeThemeAccess.spacing.get(theme, 'xl', 32),
    
    // Layout helpers
    screenPadding: safeThemeAccess.spacing.get(theme, 'layout.screen.padding', 16),
    sectionGap: safeThemeAccess.spacing.get(theme, 'layout.section.gap', 16),
    cardPaddingH: safeThemeAccess.spacing.get(theme, 'layout.card.padding.horizontal', 16),
    cardPaddingV: safeThemeAccess.spacing.get(theme, 'layout.card.padding.vertical', 8),
    
    // Component helpers
    buttonPaddingH: safeThemeAccess.spacing.get(theme, 'components.button.paddingHorizontal', 16),
    buttonPaddingV: safeThemeAccess.spacing.get(theme, 'components.button.paddingVertical', 8),
  },
  
  // Color helpers
  colors: {
    primary: safeThemeAccess.colors.get(theme, 'primary.main', '#F46315'),
    primaryContainer: safeThemeAccess.colors.get(theme, 'primary.container', '#FFF7ED'),
    surface: safeThemeAccess.colors.get(theme, 'surface.main', '#FFFFFF'),
    surfaceVariant: safeThemeAccess.colors.get(theme, 'surface.variant', '#F5F5F5'),
    contentPrimary: safeThemeAccess.colors.get(theme, 'content.primary', '#1A1A1A'),
    contentSecondary: safeThemeAccess.colors.get(theme, 'content.secondary', '#6B7280'),
    border: safeThemeAccess.colors.get(theme, 'border.default', '#E5E7EB'),
  },
  
  // BorderRadius helpers
  borderRadius: {
    sm: safeThemeAccess.borderRadius.get(theme, 'sm', 4),
    md: safeThemeAccess.borderRadius.get(theme, 'md', 8),
    lg: safeThemeAccess.borderRadius.get(theme, 'lg', 12),
    xl: safeThemeAccess.borderRadius.get(theme, 'xl', 16),
  },
});

/**
 * Hook to get theme helpers
 */
export function useThemeHelpers() {
  const { theme } = useAppTheme();
  return useMemo(() => createThemeHelpers(theme), [theme]);
}

/**
 * Legacy compatibility function - creates styles with theme parameter
 * @deprecated Use useThemedStyles instead
 */
export function createStyles<T extends Record<string, any>>(
  styleCreator: (theme: Theme) => T
) {
  return (theme: Theme): T => {
    try {
      return styleCreator(theme);
    } catch (error) {
      console.error('[Theme] Error in createStyles:', error);
      return {} as T;
    }
  };
}

/**
 * Creates a styles object using the theme
 * This is a type-safe way to create styles with theme values
 * 
 * @param createStyles A function that takes the theme and returns a styles object
 * @returns A styles object
 */
export function useThemeAndStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  createStyles: (theme: Theme) => T
) {
  const { theme } = useAppTheme();
  
  const styles = useMemo(() => {
    return StyleSheet.create(createStyles(theme));
  }, [theme, createStyles]);
  
  return { theme, styles };
}

/**
 * A utility function to safely access nested theme properties
 * 
 * @param obj The object to access properties from
 * @param path The path to the property
 * @param fallback A fallback value if the property is undefined
 * @returns The property value or the fallback
 */
export function getThemeValue<T>(obj: Record<string, any>, path: string, fallback: T | undefined = undefined): T | undefined {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === undefined || current === null) {
      return fallback;
    }
    current = current[key];
  }
  
  return current !== undefined ? current : fallback;
} 