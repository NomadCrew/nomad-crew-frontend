import { ThemeOptions, Theme, BREAKPOINTS } from './types';
import { createSemanticColors } from './foundations/colors';
import { createTypography } from './foundations/typography';
import { createSemanticSpacing } from './foundations/spacing';
import { createSemanticElevation } from './foundations/elevation';

const defaultBorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export function createTheme(options: ThemeOptions = {}): Theme {
  const {
    isDark = false,
    fontFamily = 'Inter',
    spacing: customSpacing,
    borderRadius: customBorderRadius,
    breakpoints = BREAKPOINTS,
  } = options;

  const semanticColors = createSemanticColors(isDark);
  const typography = createTypography(fontFamily);
  const spacing = createSemanticSpacing();
  const elevation = createSemanticElevation(isDark);

  return {
    colors: {
      ...semanticColors,
      error: {
        background: '#FEF2F2',
        content: '#DC2626',
        border: '#FCA5A5',
      },
    },
    typography,
    spacing: {
      ...spacing,
      ...customSpacing,
    },
    elevation,
    breakpoints,
    components: {
      Button: {
        base: {
          height: 48,
          borderRadius: defaultBorderRadius.md,
          paddingHorizontal: spacing.components.button.paddingHorizontal,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        variants: {
          primary: {
            backgroundColor: semanticColors.primary.main,
          },
          secondary: {
            backgroundColor: semanticColors.background.surface,
          },
        },
        sizes: {
          sm: {
            height: 32,
            paddingHorizontal: spacing.components.button.paddingHorizontal,
            ...typography.button,
            fontSize: 14,
          },
          md: {
            height: 40,
            paddingHorizontal: spacing.components.button.paddingHorizontal,
            ...typography.button,
          },
          lg: {
            height: 48,
            paddingHorizontal: spacing.components.button.paddingHorizontal,
            ...typography.button,
            fontSize: 18,
          },
        },
      },
      Container: {
        base: {
          width: '100%',
          maxWidth: breakpoints.desktop,
          marginHorizontal: 'auto',
          paddingHorizontal: spacing.layout.screen.padding,
        },
      },
    },
  };
}