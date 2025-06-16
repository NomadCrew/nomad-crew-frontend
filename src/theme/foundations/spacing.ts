/**
 * Design System: Spacing Foundation
 * 
 * Consistent spacing and layout scales for the NomadCrew design system.
 * Based on 4px base unit with semantic naming for different contexts.
 */

// Base unit for all spacing calculations
const BASE_UNIT = 4;

/**
 * Core spacing scale based on 4px units
 * Used for margins, paddings, gaps, and positioning
 */
export const spacing = {
  // Micro spacings (0-16px)
  none: 0,
  xxs: BASE_UNIT * 1,      // 4px  - Very tight spacing
  xs: BASE_UNIT * 2,       // 8px  - Tight spacing between related elements
  sm: BASE_UNIT * 3,       // 12px - Small spacing
  md: BASE_UNIT * 4,       // 16px - Default/medium spacing
  
  // Standard spacings (20-32px)
  lg: BASE_UNIT * 5,       // 20px - Large spacing
  xl: BASE_UNIT * 6,       // 24px - Extra large spacing
  xxl: BASE_UNIT * 8,      // 32px - Very large spacing
  
  // Layout spacings (40-96px)
  xxxl: BASE_UNIT * 10,    // 40px - Section spacing
  xxxxl: BASE_UNIT * 12,   // 48px - Large section spacing
  massive: BASE_UNIT * 16, // 64px - Massive spacing
  giant: BASE_UNIT * 20,   // 80px - Giant spacing
  enormous: BASE_UNIT * 24, // 96px - Enormous spacing
} as const;

/**
 * Component-specific spacing patterns
 * Semantic spacing for common UI patterns
 */
export const componentSpacing = {
  // Button spacings
  button: {
    paddingHorizontal: spacing.lg,     // 20px
    paddingVertical: spacing.sm,       // 12px
    iconSpacing: spacing.xs,           // 8px
    gap: spacing.sm,                   // 12px between buttons
  },
  
  // Card spacings
  card: {
    padding: spacing.xl,               // 24px
    margin: spacing.md,                // 16px
    innerSpacing: spacing.md,          // 16px between card elements
    headerSpacing: spacing.lg,         // 20px for card headers
  },
  
  // List spacings
  list: {
    itemSpacing: spacing.md,           // 16px between list items
    itemPadding: spacing.lg,           // 20px item padding
    sectionSpacing: spacing.xxl,       // 32px between sections
    headerSpacing: spacing.xl,         // 24px for list headers
  },
  
  // Input spacings
  input: {
    padding: spacing.md,               // 16px
    margin: spacing.md,                // 16px
    labelSpacing: spacing.xs,          // 8px between label and input
    helperSpacing: spacing.xxs,        // 4px for helper text
  },
  
  // Screen layout spacings
  screen: {
    padding: spacing.xl,               // 24px screen edges
    headerSpacing: spacing.xxl,        // 32px below headers
    sectionSpacing: spacing.xxxl,      // 40px between sections
    bottomSpacing: spacing.massive,    // 64px bottom padding for tab navigation
  },
  
  // Navigation spacings
  navigation: {
    tabPadding: spacing.md,            // 16px tab padding
    tabSpacing: spacing.xs,            // 8px between tabs
    headerHeight: 56,                  // Standard header height
    tabBarHeight: 60,                  // Standard tab bar height
  },
} as const;

/**
 * Layout grid system
 * Consistent grid patterns for responsive layouts
 */
export const grid = {
  // Container spacings
  container: {
    paddingHorizontal: spacing.xl,     // 24px
    maxWidth: 400,                     // Max content width for mobile
  },
  
  // Grid spacings
  columns: {
    gap: spacing.md,                   // 16px between columns
    padding: spacing.xs,               // 8px column padding
  },
  
  // Responsive breakpoints (for future tablet support)
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
  },
} as const;

/**
 * Border radius scale
 * Consistent corner radius values
 */
export const borderRadius = {
  none: 0,
  xs: BASE_UNIT * 1,       // 4px  - Subtle rounding
  sm: BASE_UNIT * 2,       // 8px  - Small rounding
  md: BASE_UNIT * 3,       // 12px - Medium rounding (default)
  lg: BASE_UNIT * 4,       // 16px - Large rounding
  xl: BASE_UNIT * 5,       // 20px - Extra large rounding
  xxl: BASE_UNIT * 6,      // 24px - Very large rounding
  round: 999,              // Fully rounded (pills, circles)
} as const;

/**
 * Shadow and elevation system
 * Consistent depth and elevation patterns
 */
export const elevation = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

/**
 * Icon size scale
 * Consistent icon sizing across the app
 */
export const iconSizes = {
  xs: 12,   // Very small icons
  sm: 16,   // Small icons
  md: 20,   // Default icon size
  lg: 24,   // Large icons
  xl: 32,   // Extra large icons
  xxl: 48,  // Very large icons
  xxxl: 64, // Icon-only buttons, avatars
} as const;

/**
 * Typography spacing
 * Line heights and spacing for text elements
 */
export const typography = {
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;

// Type definitions
export type Spacing = keyof typeof spacing;
export type ComponentSpacing = typeof componentSpacing;
export type Grid = typeof grid;
export type BorderRadius = keyof typeof borderRadius;
export type Elevation = keyof typeof elevation;
export type IconSize = keyof typeof iconSizes;
export type Typography = typeof typography;

/**
 * Utility functions for spacing calculations
 */
export const spacingUtils = {
  /**
   * Get spacing value by key
   */
  get: (key: Spacing) => spacing[key],
  
  /**
   * Multiply spacing by factor
   */
  multiply: (key: Spacing, factor: number) => spacing[key] * factor,
  
  /**
   * Add two spacing values
   */
  add: (key1: Spacing, key2: Spacing) => spacing[key1] + spacing[key2],
  
  /**
   * Get responsive spacing (for future tablet support)
   */
  responsive: (mobile: Spacing, tablet?: Spacing) => ({
    mobile: spacing[mobile],
    tablet: spacing[tablet || mobile],
  }),
  
  /**
   * Create consistent padding object
   */
  padding: {
    all: (key: Spacing) => spacing[key],
    horizontal: (key: Spacing) => ({ paddingHorizontal: spacing[key] }),
    vertical: (key: Spacing) => ({ paddingVertical: spacing[key] }),
    top: (key: Spacing) => ({ paddingTop: spacing[key] }),
    bottom: (key: Spacing) => ({ paddingBottom: spacing[key] }),
    left: (key: Spacing) => ({ paddingLeft: spacing[key] }),
    right: (key: Spacing) => ({ paddingRight: spacing[key] }),
  },
  
  /**
   * Create consistent margin object
   */
  margin: {
    all: (key: Spacing) => spacing[key],
    horizontal: (key: Spacing) => ({ marginHorizontal: spacing[key] }),
    vertical: (key: Spacing) => ({ marginVertical: spacing[key] }),
    top: (key: Spacing) => ({ marginTop: spacing[key] }),
    bottom: (key: Spacing) => ({ marginBottom: spacing[key] }),
    left: (key: Spacing) => ({ marginLeft: spacing[key] }),
    right: (key: Spacing) => ({ marginRight: spacing[key] }),
  },
} as const;