import type { SemanticColors } from './foundations/colors';
import type { Typography } from './foundations/typography';
import type { SemanticSpacing } from './foundations/spacing';
import type { SemanticElevation } from './foundations/elevation';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeOptions {
  isDark?: boolean;
  fontFamily?: string;
  spacing?: Partial<SemanticSpacing>;
  colors?: Partial<SemanticColors>;
}

export interface Theme {
  colors: SemanticColors;
  typography: Typography;
  spacing: SemanticSpacing;
  elevation: SemanticElevation;
  
  // Component-specific theme overrides
  components: {
    [key: string]: unknown; // Will be properly typed when we add component themes
  };
}

// Theme tokens are the raw values used to build the theme
export interface ThemeTokens {
  colors: SemanticColors;
  typography: Typography;
  spacing: SemanticSpacing;
  elevation: SemanticElevation;
}