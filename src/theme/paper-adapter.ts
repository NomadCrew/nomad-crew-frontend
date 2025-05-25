/**
 * paper-adapter.ts
 * -----------------------------------
 * Adapts the NomadCrew semantic theme to React Native Paper's theme structure.
 * Use this to ensure Paper components receive the correct colors, roundness, and fonts.
 */

import { Theme as SemanticTheme } from './types';
import { DefaultTheme as PaperDefaultTheme, MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

/**
 * Maps the NomadCrew semantic theme to a Paper-compatible theme.
 * @param semanticTheme The NomadCrew theme object
 * @returns A React Native Paper theme object
 */
export function createPaperTheme(semanticTheme: SemanticTheme) {
  // Map semantic colors to Paper's expected keys
  const isDark = !!semanticTheme.dark;
  const base = isDark ? MD3DarkTheme : MD3LightTheme;

  // Map fonts from semantic theme (if available)
  const fontConfig = {
    fontFamily: semanticTheme.typography?.body?.medium?.fontFamily || 'System',
    fontWeight: semanticTheme.typography?.body?.medium?.fontWeight || '400',
  };

  // Map colors
  const colors = {
    ...base.colors,
    primary: semanticTheme.colors.primary.main,
    onPrimary: semanticTheme.colors.primary.onPrimary,
    background: semanticTheme.colors.background.default,
    surface: semanticTheme.colors.surface?.default || semanticTheme.colors.background.surface,
    onSurface: semanticTheme.colors.content.primary,
    surfaceVariant: semanticTheme.colors.surface?.variant || base.colors.surfaceVariant,
    outline: semanticTheme.colors.border?.default || base.colors.outline,
    outlineVariant: semanticTheme.colors.border?.strong || base.colors.outlineVariant,
    error: semanticTheme.colors.error.main,
    onError: semanticTheme.colors.error.surface,
    secondary: semanticTheme.colors.content.secondary || base.colors.secondary,
    onSecondary: semanticTheme.colors.content.primary || base.colors.onSecondary,
    // Add more mappings as needed
  };

  // Map roundness
  const roundness = semanticTheme.borderRadius.md || base.roundness;

  // Map fonts (Paper expects a fonts object)
  const fonts = configureFonts({ config: {
    regular: fontConfig,
    medium: fontConfig,
    light: fontConfig,
    thin: fontConfig,
  }});

  return {
    ...base,
    dark: isDark,
    roundness,
    colors,
    fonts,
  };
} 