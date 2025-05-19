/**
 * theme.ts
 * -----------------------------------
 * Single source of truth for global theme tokens (borderRadius, typography sizes, etc.)
 * Used by the theme system and Paper adapter for consistent design tokens.
 *
 * To add a new token, export it here and use it in theme creation.
 */

// Border radius tokens
export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Typography size tokens
export const typographySizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
  '4xl': 48,
} as const;

// Export all tokens for use in theme creation and Paper adapter
export const themeTokens = {
  borderRadius,
  typographySizes,
}; 