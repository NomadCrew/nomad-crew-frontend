// Base unit for our spacing system (in pixels)
const SPACE_UNIT = 4;

// Core spacing scale - multiples of our base unit
export const spaceScale = {
  none: 0,
  xxs: SPACE_UNIT * 0.5,    // 2px
  xs: SPACE_UNIT,           // 4px
  sm: SPACE_UNIT * 2,       // 8px
  md: SPACE_UNIT * 4,       // 16px
  lg: SPACE_UNIT * 6,       // 24px
  xl: SPACE_UNIT * 8,       // 32px
  xxl: SPACE_UNIT * 12,     // 48px
  xxxl: SPACE_UNIT * 16,    // 64px
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
    padding: spacing.components.container.padding
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