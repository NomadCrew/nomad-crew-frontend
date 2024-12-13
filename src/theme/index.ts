import { MD3LightTheme } from 'react-native-paper';
import * as tokens from './tokens';

const extendedPalette = {
  // Primary Brand Color with variations
  orange: {
    100: '#FFE8E0', // Lightest
    200: '#FFCBB3',
    300: '#FFAD85',
    400: '#FF8F57',
    500: '#F46315', // Our primary orange
    600: '#D14800',
    700: '#A83900',
    800: '#7F2B00',
    900: '#551D00', // Darkest
  },
  
  // Light Background with variations
  arctic: {
    50: '#F7FBFD',  // Lightest
    100: '#E6F1F7', // Our light background
    200: '#D4E7F1',
    300: '#C2DDEB',
    400: '#B0D3E5',
    500: '#9EC9DF',
    600: '#8CBFD9',
    700: '#7AB5D3',
    800: '#68ABCD',
    900: '#56A1C7',  // Darkest
  },

  // Dark Background with variations
  carbon: {
    50: '#2A2D2B',
    100: '#242726',
    200: '#1E2120',
    300: '#181B1A',
    400: '#131614', // Our dark background
    500: '#0E110F',
    600: '#090C0A',
    700: '#040705',
    800: '#000200',
    900: '#000000',
  },

  // Secondary/Accent with variations
  purple: {
    50: '#EAE8F6',
    100: '#D5D1ED',
    200: '#C0BAE4',
    300: '#ABA3DB',
    400: '#968CD2',
    500: '#6558B4', // Our secondary color
    600: '#514696',
    700: '#3D3578',
    800: '#29235A',
    900: '#15113C',
  },

  // Alternative Dark Accent with variations
  ocean: {
    50: '#E6F6FB',
    100: '#CCEDF7',
    200: '#B3E4F3',
    300: '#99DBEF',
    400: '#80D2EB',
    500: '#0094B6', // Our alternative dark
    600: '#007692',
    700: '#00586E',
    800: '#003A4A',
    900: '#001C26',
  },
};

const baseTheme = {
  ...MD3LightTheme,
  
  // Keep existing token integrations
  spacing: tokens.spacing,
  borderRadius: tokens.borderRadius,
  typography: {
    fontSize: tokens.fontSize,
    fontWeight: tokens.fontWeight,
    lineHeight: tokens.lineHeight,
  },
  elevation: tokens.elevation,
  animation: tokens.animation,
  zIndex: tokens.zIndex,
  layout: tokens.layout,
  
  components: {
    Card: {
      elevation: tokens.elevation.sm,
      borderRadius: tokens.borderRadius.md,
      padding: tokens.spacing.md,
    },
    Button: {
      borderRadius: tokens.borderRadius.md,
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
      fontSize: tokens.fontSize.base,
    },
    Input: {
      height: tokens.spacing.xl,
      paddingHorizontal: tokens.spacing.md,
      borderRadius: tokens.borderRadius.md,
      fontSize: tokens.fontSize.base,
      borderWidth: 1,
    },
    ListItem: {
      minHeight: tokens.spacing.xl,
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
    },
    Modal: {
      borderRadius: tokens.borderRadius.lg,
      padding: tokens.spacing.lg,
    },
  }
};

export const lightTheme = {
  ...baseTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors
    primary: extendedPalette.orange[500],
    primaryContainer: extendedPalette.orange[100],
    
    // Background colors
    background: extendedPalette.arctic[100],
    surface: '#FFFFFF',
    surfaceVariant: extendedPalette.arctic[200],
    
    // Secondary/Accent colors
    secondary: extendedPalette.purple[500],
    secondaryContainer: extendedPalette.purple[50],
    
    // Alternative accent
    alternative: extendedPalette.ocean[500],
    alternativeContainer: extendedPalette.ocean[50],
    
    // Text colors
    onBackground: extendedPalette.carbon[400],
    onSurface: extendedPalette.carbon[400],
    onSurfaceVariant: extendedPalette.carbon[300],
    
    // Status colors
    success: '#34D399',
    warning: '#FBBF24',
    error: '#DC2626',
    info: '#38BDF8',
    
    // Extended palette
    palette: extendedPalette,
  },
};

export const darkTheme = {
  ...baseTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors
    primary: extendedPalette.orange[400], // Slightly lighter for dark theme
    primaryContainer: extendedPalette.orange[800],
    
    // Background colors
    background: extendedPalette.carbon[400],
    surface: extendedPalette.carbon[300],
    surfaceVariant: extendedPalette.carbon[200],
    
    // Secondary/Accent colors
    secondary: extendedPalette.purple[400],
    secondaryContainer: extendedPalette.purple[900],
    
    // Alternative accent
    alternative: extendedPalette.ocean[400],
    alternativeContainer: extendedPalette.ocean[900],
    
    // Text colors
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    onSurfaceVariant: extendedPalette.arctic[100],
    
    // Status colors adjusted for dark theme
    success: '#3CD89F',
    warning: '#FCD34D',
    error: '#F87171',
    info: '#60A5FA',
    
    // Extended palette
    palette: extendedPalette,
  },
};

// Keep existing exports and utilities
export const theme = lightTheme;
export function getComponentStyles(component: keyof typeof baseTheme.components) {
  return baseTheme.components[component];
}
export type AppTheme = typeof theme;
export function isAppTheme(theme: any): theme is AppTheme {
  return theme && theme.colors && theme.spacing;
}