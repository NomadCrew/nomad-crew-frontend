import { Platform } from 'react-native';

// Font scaling system
export const scale = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

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
  // Display text styles
  display: {
    large: {
      fontSize: scale['5xl'],
      lineHeight: scale['5xl'] * lineHeights.tight,
      fontWeight: weights.bold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.tight,
    },
    medium: {
      fontSize: scale['4xl'],
      lineHeight: scale['4xl'] * lineHeights.tight,
      fontWeight: weights.bold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.tight,
    },
    small: {
      fontSize: scale['3xl'],
      lineHeight: scale['3xl'] * lineHeights.tight,
      fontWeight: weights.bold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.tight,
    },
  },

  // Heading text styles
  heading: {
    h1: {
      fontSize: scale['3xl'],
      lineHeight: scale['3xl'] * lineHeights.tight,
      fontWeight: weights.bold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.tight,
    },
    h2: {
      fontSize: scale['2xl'],
      lineHeight: scale['2xl'] * lineHeights.tight,
      fontWeight: weights.bold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.tight,
    },
    h3: {
      fontSize: scale.xl,
      lineHeight: scale.xl * lineHeights.tight,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
    h4: {
      fontSize: scale.lg,
      lineHeight: scale.lg * lineHeights.tight,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
    h5: {
      fontSize: scale.base,
      lineHeight: scale.base * lineHeights.tight,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
    h6: {
      fontSize: scale.sm,
      lineHeight: scale.sm * lineHeights.tight,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Body text styles
  body: {
    large: {
      fontSize: scale.lg,
      lineHeight: scale.lg * lineHeights.normal,
      fontWeight: weights.normal,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
    medium: {
      fontSize: scale.base,
      lineHeight: scale.base * lineHeights.normal,
      fontWeight: weights.normal,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
    small: {
      fontSize: scale.sm,
      lineHeight: scale.sm * lineHeights.normal,
      fontWeight: weights.normal,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Interactive element text styles
  button: {
    large: {
      fontSize: scale.lg,
      lineHeight: scale.lg * lineHeights.snug,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.wide,
    },
    medium: {
      fontSize: scale.base,
      lineHeight: scale.base * lineHeights.snug,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.wide,
    },
    small: {
      fontSize: scale.sm,
      lineHeight: scale.sm * lineHeights.snug,
      fontWeight: weights.semibold,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.wide,
    },
  },

  // Form element text styles
  input: {
    label: {
      fontSize: scale.sm,
      lineHeight: scale.sm * lineHeights.normal,
      fontWeight: weights.medium,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.wide,
    },
    text: {
      fontSize: scale.base,
      lineHeight: scale.base * lineHeights.normal,
      fontWeight: weights.normal,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
    helper: {
      fontSize: scale.xs,
      lineHeight: scale.xs * lineHeights.normal,
      fontWeight: weights.normal,
      fontFamily: baseFontFamily,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Special text styles
  caption: {
    fontSize: scale.xs,
    lineHeight: scale.xs * lineHeights.normal,
    fontWeight: weights.normal,
    fontFamily: baseFontFamily,
    letterSpacing: letterSpacing.wide,
  },
  overline: {
    fontSize: scale.xs,
    lineHeight: scale.xs * lineHeights.normal,
    fontWeight: weights.medium,
    fontFamily: baseFontFamily,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase',
  },
});

// Type exports
export type TypographyScale = typeof scale;
export type FontWeights = typeof weights;
export type LineHeights = typeof lineHeights;
export type LetterSpacing = typeof letterSpacing;
export type Typography = ReturnType<typeof createTypography>;