import { Theme } from './types';

/**
 * This file provides a compatibility layer for the theme.
 * It ensures consistent access to common properties across all components.
 */

// Typography size constants
export const TYPOGRAPHY_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// Border radius constants
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

/**
 * Extends the theme with additional properties for backward compatibility
 * and consistent access across components.
 */
export function extendTheme(theme: Theme): Theme & {
  typography: Theme['typography'] & { size: typeof TYPOGRAPHY_SIZES };
  borderRadius: typeof BORDER_RADIUS;
} {
  return {
    ...theme,
    // Add size property to typography for backward compatibility
    typography: {
      ...theme.typography,
      size: TYPOGRAPHY_SIZES,
    },
    // Add borderRadius property for consistent access
    borderRadius: BORDER_RADIUS,
  };
}

/**
 * Helper function to get a typography size value
 * @param theme The theme object
 * @param size The size key (xs, sm, md, lg, xl, etc.)
 * @returns The font size value
 */
export function getTypographySize(theme: Theme, size: keyof typeof TYPOGRAPHY_SIZES): number {
  return TYPOGRAPHY_SIZES[size];
}

/**
 * Helper function to get a border radius value
 * @param theme The theme object
 * @param size The size key (none, sm, md, lg, xl, full)
 * @returns The border radius value
 */
export function getBorderRadius(theme: Theme, size: keyof typeof BORDER_RADIUS): number {
  return BORDER_RADIUS[size];
} 