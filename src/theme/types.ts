import { ColorValue, TextStyle, ViewStyle } from 'react-native';
import { SemanticColors } from './foundations/colors';
import { SemanticSpacing } from './foundations/spacing';
import { Typography } from './foundations/typography';
import { SemanticElevation } from './foundations/elevation';

export type ThemeMode = 'light' | 'dark' | 'system';

// Define breakpoints
export const BREAKPOINTS = {
  mobile: 320,
  tablet: 720, 
  desktop: 1024,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Single ThemeOptions interface
export interface ThemeOptions {
  isDark?: boolean;
  fontFamily?: string;
  spacing?: Partial<SemanticSpacing>;
  borderRadius?: {
    none?: number;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    full?: number;
  };
  breakpoints?: typeof BREAKPOINTS;
}

export interface ComponentStyles {
  Button?: {
    base?: ViewStyle;
    variants?: Record<string, ViewStyle>;
    sizes?: Record<string, ViewStyle & Partial<TextStyle>>;
  };
  Container?: {
    base?: ViewStyle;
    variants?: Record<string, ViewStyle>;
  };
}

// Extended Status colors interface to include missing properties
export interface StatusColors {
  error: {
    surface: string;
    content: string;
    background: string;
    border: string;
    main?: string;
  };
  success: {
    surface: string;
    content: string;
    background: string;
    border: string;
    main?: string;
  };
  warning: {
    surface: string;
    content: string;
    background?: string;
    border?: string;
    main?: string;
  };
  info: {
    surface: string;
    content: string;
    background?: string;
    border?: string;
    main?: string;
  };
  planning: {
    background: string;
    content: string;
  };
  completed: {
    background: string;
    content: string;
  };
}

// Extended colors to include disabled state
export interface ExtendedColors {
  disabled?: {
    background: string;
    text: string;
    border: string;
  };
  outlined?: {
    background: string;
    text: string;
    border?: string;
  };
  success?: {
    surface: string;
    main: string;
  };
  warning?: {
    surface: string;
    main: string;
  };
  error?: {
    surface: string;
    main: string;
  };
  info?: {
    surface: string;
    main: string;
  };
}

// Font size interface for typography
export interface FontSizes {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

// Extended Typography interface
export interface ExtendedTypography extends Typography {
  size?: FontSizes;
}

export interface ThemeColors {
  // ... other color definitions
  error: {
    background: string;
    content: string;
    border: string;
  };
}

export interface Theme {
  colors: SemanticColors & ExtendedColors;
  typography: ExtendedTypography;
  spacing: SemanticSpacing;
  elevation: SemanticElevation;
  components: ComponentStyles;
  breakpoints: typeof BREAKPOINTS;
  borderRadius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  dark?: boolean;
}

// Helper types
export type ThemeNestedValue<T> = T | Record<string, T>;
export type ThemeColorValue = ColorValue | keyof SemanticColors;