/**
 * typography.ts
 * -----------------------------------
 * Typography foundation using typographySizes from theme.ts as the single source of truth.
 */

import { Platform } from 'react-native';
import { typographySizes } from '../theme';

// Font weights - platform specific for better rendering
export const weights = {
  normal: Platform.select({
    ios: '400' as const,
    android: '400' as const,
    default: '400' as const,
  }),
  medium: Platform.select({
    ios: '500' as const,
    android: '500' as const,
    default: '500' as const,
  }),
  semibold: Platform.select({
    ios: '600' as const,
    android: '600' as const,
    default: '600' as const,
  }),
  bold: Platform.select({
    ios: '700' as const,
    android: '700' as const,
    default: '700' as const,
  }),
} as const;

// Line heights for different text sizes
export const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

// Letter spacing values
export const letterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  widest: 1.6,
} as const;

// Create typography styles based on font family
export const createTypography = (baseFontFamily = 'Manrope') => ({
  // Font size tokens
  size: typographySizes,
  fontSizes: typographySizes, // Alias for backward compatibility

  // Display text styles
  display: {
    large: {
      fontSize: typographySizes['4xl'],
      lineHeight: typographySizes['4xl'] * lineHeights.tight,
      fontWeight: weights.bold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.tight,
    },
    medium: {
      fontSize: typographySizes['3xl'],
      lineHeight: typographySizes['3xl'] * lineHeights.tight,
      fontWeight: weights.bold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.tight,
    },
    small: {
      fontSize: typographySizes['2xl'],
      lineHeight: typographySizes['2xl'] * lineHeights.tight,
      fontWeight: weights.bold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.tight,
    },
  },

  // Heading text styles
  heading: {
    h1: {
      fontSize: typographySizes['2xl'],
      lineHeight: typographySizes['2xl'] * lineHeights.tight,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.tight,
    },
    h2: {
      fontSize: typographySizes.xl,
      lineHeight: typographySizes.xl * lineHeights.tight,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.tight,
    },
    h3: {
      fontSize: typographySizes.lg,
      lineHeight: typographySizes.lg * lineHeights.tight,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
    h4: {
      fontSize: typographySizes.md,
      lineHeight: typographySizes.md * lineHeights.tight,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
    h5: {
      fontSize: typographySizes.sm,
      lineHeight: typographySizes.sm * lineHeights.tight,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
    h6: {
      fontSize: typographySizes.xs,
      lineHeight: typographySizes.xs * lineHeights.tight,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Body text styles
  body: {
    large: {
      fontSize: typographySizes.lg,
      lineHeight: typographySizes.lg * lineHeights.normal,
      fontWeight: weights.normal,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
    medium: {
      fontSize: typographySizes.md,
      lineHeight: typographySizes.md * lineHeights.normal,
      fontWeight: weights.normal,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
    small: {
      fontSize: typographySizes.sm,
      lineHeight: typographySizes.sm * lineHeights.normal,
      fontWeight: weights.normal,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Interactive element text styles
  button: {
    large: {
      fontSize: typographySizes.lg,
      lineHeight: typographySizes.lg * lineHeights.snug,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.wide,
    },
    medium: {
      fontSize: typographySizes.md,
      lineHeight: typographySizes.md * lineHeights.snug,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.wide,
    },
    small: {
      fontSize: typographySizes.sm,
      lineHeight: typographySizes.sm * lineHeights.snug,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.wide,
    },
  },

  // Form element text styles
  input: {
    label: {
      fontSize: typographySizes.sm,
      lineHeight: typographySizes.sm * lineHeights.normal,
      fontWeight: weights.medium,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.wide,
    },
    text: {
      fontSize: typographySizes.md,
      lineHeight: typographySizes.md * lineHeights.normal,
      fontWeight: weights.normal,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
    helper: {
      fontSize: typographySizes.xs,
      lineHeight: typographySizes.xs * lineHeights.normal,
      fontWeight: weights.normal,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Special text styles
  caption: {
    fontSize: typographySizes.xs,
    lineHeight: typographySizes.xs * lineHeights.normal,
    fontWeight: weights.medium,
    fontFamily: baseFontFamily,
    letterSpacing: letterSpacing.wide,
  },
  overline: {
    fontSize: typographySizes.xs,
    lineHeight: typographySizes.xs * lineHeights.normal,
    fontWeight: weights.medium,
    fontFamily: baseFontFamily,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase',
  },
});

// Type exports
export type TypographyScale = typeof typographySizes;
export type FontWeights = typeof weights;
export type LineHeights = typeof lineHeights;
export type LetterSpacing = typeof letterSpacing;
export type Typography = ReturnType<typeof createTypography>;
