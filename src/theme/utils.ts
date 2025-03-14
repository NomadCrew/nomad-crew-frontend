import { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';
import { logger } from '../utils/logger';

/**
 * Creates a styles object using the theme
 * This is a type-safe way to create styles with theme values
 * 
 * @param createStyles A function that takes the theme and returns a styles object
 * @returns A styles object
 */
export function createStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  createStyles: (theme: any) => T
) {
  return createStyles;
}

/**
 * A hook that returns the theme and styles created with the theme
 * This is a type-safe way to use theme values in styles
 * 
 * @param createStyles A function that takes the theme and returns a styles object
 * @returns An object with the theme and styles
 */
export function useThemeAndStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  createStyles: (theme: any) => T
) {
  const { theme } = useTheme();
  
  const styles = useMemo(() => {
    return StyleSheet.create(createStyles(theme));
  }, [theme, createStyles]);
  
  return { theme, styles };
}

/**
 * A hook that returns styles created with the theme
 * This is a type-safe way to use theme values in styles with safe access
 * 
 * @param stylesFn A function that takes the theme and returns a styles object
 * @returns A styles object with safe access to theme properties
 */
export function useThemedStyles<T extends Record<string, any>>(
  stylesFn: (theme: any) => T
): T {
  const { theme } = useTheme();
  
  // Create a safe version of the theme that handles undefined properties
  const safeTheme = useMemo(() => {
    if (!theme) return {};
    
    // Create a proxy to handle undefined properties safely
    return new Proxy(theme, {
      get: (target, prop) => {
        const value = target[prop];
        if (typeof value === 'object' && value !== null) {
          return new Proxy(value, {
            get: (obj, key) => {
              return obj[key] !== undefined ? obj[key] : null;
            }
          });
        }
        return value;
      }
    });
  }, [theme]);
  
  // Memoize the styles to prevent unnecessary recalculations
  const styles = useMemo(() => {
    try {
      return stylesFn(safeTheme);
    } catch (error) {
      logger.warn('UI', 'Error creating styles:', error);
      // Return an empty object if there's an error
      return {} as T;
    }
  }, [safeTheme, stylesFn]);
  
  return styles;
}

/**
 * A utility function to safely access nested theme properties
 * 
 * @param obj The object to access properties from
 * @param path The path to the property
 * @param fallback A fallback value if the property is undefined
 * @returns The property value or the fallback
 */
export function getThemeValue(obj: any, path: string, fallback: any = undefined): any {
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