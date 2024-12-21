import { ColorValue, TextStyle, ViewStyle } from 'react-native';
import { SemanticColors } from './foundations/colors';
import { SemanticSpacing } from './foundations/spacing';
import { Typography } from './foundations/typography';
import { SemanticElevation } from './foundations/elevation';

export type ThemeMode = 'light' | 'dark' | 'system';

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
}

export interface Theme {
  colors: SemanticColors;
  typography: Typography;
  spacing: SemanticSpacing;
  elevation: SemanticElevation;
  components: ComponentStyles;
}

export interface ComponentStyles {
  Button?: {
    base?: ViewStyle;
    variants?: Record<string, ViewStyle>;
    sizes?: Record<string, ViewStyle & Partial<TextStyle>>;
  };
  // Add other component styles as needed
}

// Helper type for getting nested theme values
export type ThemeNestedValue<T> = T | Record<string, T>;

// Helper type for color values that can be either direct or semantic
export type ThemeColorValue = ColorValue | keyof SemanticColors;