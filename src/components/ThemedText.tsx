import React from 'react';
import { Text, TextProps } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useThemedStyles } from '@/src/theme/utils';
import { logger } from '@/src/utils/logger';
import type { Typography } from '@/src/theme/foundations/typography';
import type { SemanticColors } from '@/src/theme/foundations/colors';

// Helper type to create dot notation paths for nested objects
type DotNotation<T, D extends number = 2, P extends string = ''> = [D] extends [0]
  ? P
  : T extends object
    ? {
        [K in keyof T & string]: DotNotation<
          T[K],
          D extends 2 ? 1 : 0,
          P extends '' ? K : `${P}.${K}`
        >;
      }[keyof T & string]
    : P;

// Type for typography variants using dot notation
type TypographyVariant = DotNotation<Typography, 2>;

// Type for color variants using dot notation
type ColorVariant = DotNotation<SemanticColors>;

export interface ThemedTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorVariant;
  isHeading?: boolean;
  accessibilityRole?: 'header' | 'text' | 'link' | 'button';
  minTouchSize?: number;
}

/**
 * Render a themed Text element that applies typography, color, accessibility role, and optional minimum touch size from the app theme.
 *
 * @param variant - Dot-notated typography key in the form `category.size` (e.g., `body.medium`). Falls back to `body.medium` if invalid.
 * @param color - Dot-notated color key in the form `category.shade` (e.g., `content.primary`). Falls back to `content.primary` if invalid.
 * @param isHeading - When true and no explicit `accessibilityRole` is provided, the component uses the `header` accessibility role; otherwise `text`.
 * @param accessibilityRole - Explicit accessibility role to apply to the rendered Text; if provided, it overrides the `isHeading` defaulting behavior.
 * @param minTouchSize - If provided, enforces `minHeight` and `minWidth` equal to this value to increase touch target size.
 * @returns A React Native Text element styled according to the resolved theme typography and color, merging any passed `style` and forwarding remaining props.
 */
export function ThemedText({
  style,
  children,
  variant = 'body.medium',
  color = 'content.primary',
  isHeading = false,
  accessibilityRole,
  minTouchSize,
  ...rest
}: ThemedTextProps) {
  const { theme } = useAppTheme();

  // Use our new utility to create styles
  const styles = useThemedStyles(() => ({
    text: {
      ...getTypographyStyle(),
      color: getTextColor(),
      ...(minTouchSize ? { minHeight: minTouchSize, minWidth: minTouchSize } : {}),
    },
  }));

  function getTypographyStyle() {
    try {
      const parts = variant.split('.');
      const category = parts[0];
      const size = parts[1];

      if (!category || !size) {
        return theme.typography.body.medium;
      }

      const categoryKey = category as keyof typeof theme.typography;
      const categoryStyles = theme.typography[categoryKey];

      // Type guard to ensure we have an object with the right properties
      if (categoryStyles && typeof categoryStyles === 'object' && size in categoryStyles) {
        return categoryStyles[size as keyof typeof categoryStyles];
      }
    } catch (_error) {
      logger.warn('UI', `Invalid typography variant: ${variant}`);
    }

    // Fallback to body.medium if variant is invalid
    return theme.typography.body.medium;
  }

  function getTextColor() {
    try {
      const parts = color.split('.');
      const category = parts[0];
      const shade = parts[1];

      if (!category || !shade) {
        return theme.colors.content.primary;
      }

      const categoryKey = category as keyof typeof theme.colors;
      const colorCategory = theme.colors[categoryKey];

      // Type guard to ensure we have an object with the right properties
      if (colorCategory && typeof colorCategory === 'object' && shade in colorCategory) {
        return colorCategory[shade as keyof typeof colorCategory];
      }
    } catch (_error) {
      logger.warn('UI', `Invalid color variant: ${color}`);
    }

    return theme.colors.content.primary;
  }

  return (
    <Text
      style={[styles.text, style]}
      accessibilityRole={accessibilityRole || (isHeading ? 'header' : 'text')}
      {...rest}
    >
      {children}
    </Text>
  );
}

export default React.memo(ThemedText);