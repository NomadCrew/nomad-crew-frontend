import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { Typography } from '@/src/theme/foundations/typography';

type TypographyVariant = 
  | keyof Typography['display']
  | keyof Typography['heading']
  | keyof Typography['body']
  | keyof Typography['button']
  | keyof Typography['input']
  | 'caption'
  | 'overline';

type TypographyCategory = keyof Typography;

export interface ThemedTextProps extends TextProps {
  variant?: TypographyVariant;
  category?: TypographyCategory;
  color?: string;
}

export function ThemedText({ 
  style, 
  variant,
  category = 'body',
  color,
  children,
  ...rest 
}: ThemedTextProps) {
  const { theme } = useTheme();
  
  const getTypographyStyle = () => {
    if (!variant) {
      // Default to body.medium if no variant specified
      return theme.typography.body.medium;
    }

    if (category === 'caption' || category === 'overline') {
      return theme.typography[category];
    }

    // Handle nested typography styles
    const categoryStyles = theme.typography[category];
    if (typeof categoryStyles === 'object' && variant in categoryStyles) {
      return categoryStyles[variant as keyof typeof categoryStyles];
    }

    // Fallback to body.medium
    return theme.typography.body.medium;
  };

  const textStyle = [
    getTypographyStyle(),
    { color: color || theme.colors.content.primary },
    style,
  ];

  return (
    <Text style={textStyle} {...rest}>
      {children}
    </Text>
  );
}

// Examples of usage:
// <ThemedText category="display" variant="large">Large Display Text</ThemedText>
// <ThemedText category="body" variant="medium">Medium Body Text</ThemedText>
// <ThemedText category="heading" variant="h1">Heading 1</ThemedText>
// <ThemedText variant="caption">Caption Text</ThemedText>

export default React.memo(ThemedText);