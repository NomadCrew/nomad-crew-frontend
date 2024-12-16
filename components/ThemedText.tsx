import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Typography } from '@/src/theme/foundations/typography';
import { SemanticColors } from '@/src/theme/foundations/colors';

type TypographyKeys<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown> 
    ? `${string & K}.${string & keyof T[K]}`
    : K;
}[keyof T];

type TypographyVariant = TypographyKeys<Typography>;

export interface ThemedTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: keyof SemanticColors['content'] | keyof SemanticColors['primary'];
}

export function ThemedText({ 
  style, 
  children, 
  variant = 'body.medium', 
  color = 'primary',
  ...rest 
}: ThemedTextProps) {
  const { theme } = useTheme();

  const getTypographyStyle = () => {
    const [category, size] = variant.split('.') as [keyof Typography, string];
    if (category && size && theme.typography[category]) {
      return theme.typography[category][size];
    }
    // Fallback to body.medium if variant is invalid
    return theme.typography.body.medium;
  };

  const textColor = color.includes('.')
    ? theme.colors[color.split('.')[0]][color.split('.')[1]]
    : theme.colors.content.primary;

  return (
    <Text 
      style={[
        getTypographyStyle(),
        { color: textColor },
        style
      ]} 
      {...rest}
    >
      {children}
    </Text>
  );
}

export default React.memo(ThemedText);