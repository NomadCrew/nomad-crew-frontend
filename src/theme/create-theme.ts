/**
 * create-theme.ts
 * -----------------------------------
 * Theme creation logic using tokens from theme.ts as the single source of truth.
 */

import { ThemeOptions, Theme, BREAKPOINTS } from './types';
import { createSemanticColors } from './foundations/colors';
import { createTypography } from './foundations/typography';
import { 
  spacing, 
  componentSpacing, 
  grid, 
  borderRadius as spacingBorderRadius,
  elevation,
  iconSizes,
  typography as spacingTypography,
  spacingUtils
} from './foundations/spacing';
import { createSemanticElevation } from './foundations/elevation';
import { borderRadius } from './theme';
import { animationTokens } from './foundations/animations';

const defaultBorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

const defaultBreakpoints = {
  mobile: 320,
  tablet: 720,
  desktop: 1024,
} as const;

export function createTheme(options: ThemeOptions = {}): Theme {
  const {
    isDark = false,
    fontFamily = 'Inter',
    spacing: customSpacing,
    borderRadius: customBorderRadius,
    breakpoints: customBreakpoints,
  } = options;

  const colors = createSemanticColors(isDark);
  const typography = createTypography(fontFamily);
  const elevationValues = createSemanticElevation(isDark);

  // Add backward compatibility for legacy content colors
  const enhancedColors = {
    ...colors,
    // Legacy content colors are already available in colors.content
    // No need to override, just ensure they exist for backward compatibility
  };

  // Use the new comprehensive spacing system with backward compatibility
  const themeSpacing = {
    // Core spacing values
    ...spacing,
    
    // Utility functions for easy access
    utils: spacingUtils,
    
    // Component-specific patterns
    components: componentSpacing,
    
    // Grid system
    grid,
    
    // Legacy support for backward compatibility
    get: spacingUtils.get,
    multiply: spacingUtils.multiply,
    add: spacingUtils.add,
    
    // Legacy spacing structure for backward compatibility
    layout: {
      screen: {
        padding: componentSpacing.screen.padding,
        gutter: spacing.md,
        maxWidth: grid.container.maxWidth,
      },
      section: {
        padding: componentSpacing.screen.sectionSpacing,
        marginBottom: spacing.xl,
        gap: spacing.md,
      },
      container: {
        padding: spacing.md,
        gap: spacing.sm,
      },
      card: {
        padding: componentSpacing.card.padding,
        margin: componentSpacing.card.margin,
        gap: componentSpacing.card.innerSpacing,
      },
    },
    
    // Legacy inline/inset spacing
    inline: {
      xxs: spacing.xxs,
      xs: spacing.xs,
      sm: spacing.sm,
      md: spacing.md,
      lg: spacing.lg,
      xl: spacing.xl,
    },
    
    inset: {
      xs: spacing.xs,
      sm: spacing.sm,
      md: spacing.md,
      lg: spacing.lg,
      xl: spacing.xl,
    },
    
    // Legacy stack spacing
    stack: {
      xxs: spacing.xxs,
      xs: spacing.xs,
      sm: spacing.sm,
      md: spacing.md,
      lg: spacing.lg,
      xl: spacing.xl,
    },
  };

  return {
    dark: isDark,
    colors: enhancedColors,
    spacing: themeSpacing,
    typography: {
      ...typography,
      lineHeight: spacingTypography.lineHeight,
      letterSpacing: spacingTypography.letterSpacing,
    },
    elevation: {
      ...elevationValues,
      values: elevation, // Add the new elevation system
    },
    borderRadius: {
      ...defaultBorderRadius,
      ...spacingBorderRadius, // Use the new border radius system
      ...customBorderRadius,
    },
    breakpoints: {
      ...defaultBreakpoints,
      ...grid.breakpoints, // Use the new grid breakpoints
      ...customBreakpoints,
    },
    animations: animationTokens,
    iconSizes, // Add icon sizes to theme
    components: {
      Button: {
        base: {
          borderRadius: spacingBorderRadius.md,
          paddingHorizontal: componentSpacing.button.paddingHorizontal,
          paddingVertical: componentSpacing.button.paddingVertical,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: componentSpacing.button.iconSpacing,
        },
        variants: {
          primary: {
            backgroundColor: enhancedColors.primary.main,
          },
          secondary: {
            backgroundColor: enhancedColors.surface.variant,
          },
          outlined: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: enhancedColors.primary.main,
          },
          ghost: {
            backgroundColor: 'transparent',
          },
        },
        sizes: {
          sm: {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            fontSize: 14,
          },
          md: {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            fontSize: 16,
          },
          lg: {
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            fontSize: 18,
          },
        },
      },
      Container: {
        base: {
          flex: 1,
          backgroundColor: enhancedColors.background?.default || enhancedColors.surface.main,
        },
        variants: {
          screen: {
            padding: componentSpacing.screen.padding,
          },
          content: {
            padding: componentSpacing.card.padding,
            maxWidth: grid.container.maxWidth,
          },
          padded: {
            padding: spacing.xl,
          },
          centered: {
            justifyContent: 'center',
            alignItems: 'center',
          },
        },
      },
      Card: {
        base: {
          backgroundColor: enhancedColors.surface.main,
          borderRadius: spacingBorderRadius.md,
          padding: componentSpacing.card.padding,
          ...elevation.md,
        },
        variants: {
          elevated: {
            ...elevation.lg,
          },
          flat: {
            ...elevation.none,
          },
        },
      },
      Input: {
        base: {
          borderRadius: spacingBorderRadius.sm,
          padding: componentSpacing.input.padding,
          borderWidth: 1,
          borderColor: enhancedColors.outline.main,
        },
        variants: {
          outlined: {
            backgroundColor: 'transparent',
          },
          filled: {
            backgroundColor: enhancedColors.surface.variant,
          },
        },
      },
      List: {
        base: {
          gap: componentSpacing.list.itemSpacing,
        },
        item: {
          padding: componentSpacing.list.itemPadding,
          borderRadius: spacingBorderRadius.sm,
        },
      },
    },
  };
}