import React, { useEffect, useState } from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Typography } from '@/src/theme/foundations/typography';
import { SemanticColors } from '@/src/theme/foundations/colors';
import { createStyles, useThemedStyles } from '@/src/theme/utils';
import { logger } from '@/src/utils/logger';

// Helper type to create dot notation paths for nested objects
type DotNotation<T, D extends number = 2, P extends string = ''> =
  [D] extends [0]
    ? P
    : T extends object
      ? {
          [K in keyof T & string]:
            DotNotation<
              T[K],
              D extends 2 ? 1 : 0,
              P extends '' ? K : `${P}.${K}`
            >
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
  const { theme } = useTheme();

  // Use our new utility to create styles
  const styles = useThemedStyles(() => ({
    text: {
      ...getTypographyStyle(),
      color: getTextColor(),
      ...(minTouchSize ? { minHeight: minTouchSize, minWidth: minTouchSize } : {}),
    }
  }));

  function getTypographyStyle() {
    try {
      const [category, size] = variant.split('.');
      const categoryKey = category as keyof typeof theme.typography;
      const categoryStyles = theme.typography[categoryKey];
      
      // Type guard to ensure we have an object with the right properties
      if (categoryStyles && 
          typeof categoryStyles === 'object' && 
          size in categoryStyles) {
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
      const [category, shade] = color.split('.');
      const categoryKey = category as keyof typeof theme.colors;
      const colorCategory = theme.colors[categoryKey];
      
      // Type guard to ensure we have an object with the right properties
      if (colorCategory && 
          typeof colorCategory === 'object' && 
          shade in colorCategory) {
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