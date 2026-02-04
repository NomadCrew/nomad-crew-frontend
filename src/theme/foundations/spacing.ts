// Base unit for our spacing system (in pixels)
const SPACE_UNIT = 4;

// Core spacing scale - multiples of our base unit
export const spaceScale = {
  none: 0,
  xxs: SPACE_UNIT * 0.5, // 2px
  xs: SPACE_UNIT, // 4px
  sm: SPACE_UNIT * 2, // 8px
  md: SPACE_UNIT * 4, // 16px
  lg: SPACE_UNIT * 6, // 24px
  xl: SPACE_UNIT * 8, // 32px
  xxl: SPACE_UNIT * 12, // 48px
  xxxl: SPACE_UNIT * 16, // 64px
} as const;

// Semantic spacing system
export const createSemanticSpacing = () => ({
  // Layout spacing
  layout: {
    screen: {
      padding: spaceScale.md,
      gutter: spaceScale.md,
      maxWidth: 600, // Max width for containers on larger screens
    },
    section: {
      padding: spaceScale.lg,
      marginBottom: spaceScale.xl,
      gap: spaceScale.md,
    },
    container: {
      padding: spaceScale.md,
      gap: spaceScale.sm,
    },
    card: {
      padding: {
        horizontal: spaceScale.md,
        vertical: spaceScale.md,
      },
      gap: spaceScale.sm,
      marginBottom: spaceScale.md,
    },
  },

  // Component spacing
  components: {
    container: {
      padding: spaceScale.md,
      gap: spaceScale.sm,
    },
    card: {
      padding: spaceScale.md,
      gap: spaceScale.sm,
      marginBottom: spaceScale.md,
    },
    button: {
      paddingVertical: spaceScale.sm,
      paddingHorizontal: spaceScale.md,
      gap: spaceScale.xs, // Space between icon and text
    },
    input: {
      padding: spaceScale.sm,
      marginBottom: spaceScale.md,
      helperTextMargin: spaceScale.xs,
      labelMargin: spaceScale.xs,
    },
    list: {
      gap: spaceScale.sm,
      itemPadding: spaceScale.sm,
    },
    modal: {
      padding: spaceScale.lg,
      gap: spaceScale.md,
    },
  },

  // Stack spacing - vertical spaces between elements
  stack: {
    xxs: spaceScale.xxs,
    xs: spaceScale.xs,
    sm: spaceScale.sm,
    md: spaceScale.md,
    lg: spaceScale.lg,
    xl: spaceScale.xl,
  },

  // Inline spacing - horizontal spaces between elements
  inline: {
    xxs: spaceScale.xxs,
    xs: spaceScale.xs,
    sm: spaceScale.sm,
    md: spaceScale.md,
    lg: spaceScale.lg,
    xl: spaceScale.xl,
  },

  // Inset spacing - internal padding
  inset: {
    xs: spaceScale.xs,
    sm: spaceScale.sm,
    md: spaceScale.md,
    lg: spaceScale.lg,
    xl: spaceScale.xl,
    // Squish - less vertical padding than horizontal
    squish: {
      xs: {
        vertical: spaceScale.xxs,
        horizontal: spaceScale.xs,
      },
      sm: {
        vertical: spaceScale.xs,
        horizontal: spaceScale.sm,
      },
      md: {
        vertical: spaceScale.sm,
        horizontal: spaceScale.md,
      },
    },
    // Stretch - more vertical padding than horizontal
    stretch: {
      sm: {
        vertical: spaceScale.sm,
        horizontal: spaceScale.xs,
      },
      md: {
        vertical: spaceScale.md,
        horizontal: spaceScale.sm,
      },
    },
  },
});

// Negative space values (for margins)
export const negativeSpace = Object.entries(spaceScale).reduce(
  (acc, [key, value]) => ({
    ...acc,
    [key]: value * -1,
  }),
  {} as { [K in keyof typeof spaceScale]: number }
);

// Type exports
export type SpaceScale = typeof spaceScale;
export type SemanticSpacing = ReturnType<typeof createSemanticSpacing>;

// Helper functions
export const getSpace = (space: keyof typeof spaceScale) => spaceScale[space];
export const getNegativeSpace = (space: keyof typeof spaceScale) => negativeSpace[space];

// Common layout helpers
export const createLayoutHelpers = (spacing: SemanticSpacing) => ({
  screenPadding: {
    padding: spacing.layout.screen.padding,
  },
  containerPadding: {
    padding: spacing.components.container.padding,
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gap: {
    xs: { gap: spacing.stack.xs },
    sm: { gap: spacing.stack.sm },
    md: { gap: spacing.stack.md },
    lg: { gap: spacing.stack.lg },
    xl: { gap: spacing.stack.xl },
  },
});

// Core spacing values - exported for create-theme.ts compatibility
export const spacing = {
  none: spaceScale.none,
  xxs: spaceScale.xxs,
  xs: spaceScale.xs,
  sm: spaceScale.sm,
  md: spaceScale.md,
  lg: spaceScale.lg,
  xl: spaceScale.xl,
  xxl: spaceScale.xxl,
  xxxl: spaceScale.xxxl,
} as const;

// Component-specific spacing patterns
export const componentSpacing = {
  screen: {
    padding: spaceScale.md,
    sectionSpacing: spaceScale.lg,
  },
  card: {
    padding: spaceScale.md,
    margin: spaceScale.sm,
    innerSpacing: spaceScale.sm,
  },
  button: {
    paddingHorizontal: spaceScale.md,
    paddingVertical: spaceScale.sm,
    iconSpacing: spaceScale.xs,
  },
  input: {
    padding: spaceScale.sm,
    marginBottom: spaceScale.md,
  },
  list: {
    itemSpacing: spaceScale.sm,
    itemPadding: spaceScale.sm,
  },
} as const;

// Grid system
export const grid = {
  container: {
    maxWidth: 600,
    padding: spaceScale.md,
  },
  breakpoints: {
    mobile: 320,
    tablet: 720,
    desktop: 1024,
  },
} as const;

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

// Elevation/shadow values
export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

// Icon sizes
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Typography-related spacing
export const typography = {
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
} as const;

// Spacing utility functions
export const spacingUtils = {
  get: (key: keyof typeof spacing) => spacing[key],
  multiply: (key: keyof typeof spacing, multiplier: number) => spacing[key] * multiplier,
  add: (key1: keyof typeof spacing, key2: keyof typeof spacing) => spacing[key1] + spacing[key2],
} as const;
