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

export interface ThemeColors {
  // ... other color definitions
  error: {
    background: string;
    content: string;
    border: string;
  };
}

export interface Theme {
  colors: SemanticColors;
  typography: Typography;
  spacing: SemanticSpacing;
  elevation: SemanticElevation;
  components: ComponentStyles;
  breakpoints: typeof BREAKPOINTS;
}

// Helper types
export type ThemeNestedValue<T> = T | Record<string, T>;
export type ThemeColorValue = ColorValue | keyof SemanticColors;