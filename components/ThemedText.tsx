import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';

export interface ThemedTextProps extends TextProps {
  type?: 'default' | 'title' | 'subtitle' | 'link' | 'defaultSemiBold';
}

export function ThemedText({ style, children, type = 'default', ...rest }: ThemedTextProps) {
  const { theme } = useTheme();

  const defaultStyle = {
    color: theme.colors.content.primary,
    fontFamily: 'Inter',
  };

  const textStyles = React.useMemo(() => {
    switch (type) {
      case 'title':
        return {
          ...defaultStyle,
          fontSize: 24,
          fontWeight: '600',
        };
      case 'subtitle':
        return {
          ...defaultStyle,
          fontSize: 18,
          opacity: 0.8,
        };
      case 'link':
        return {
          ...defaultStyle,
          color: theme.colors.primary.main,
          textDecorationLine: 'underline',
        };
      case 'defaultSemiBold':
        return {
          ...defaultStyle,
          fontWeight: '600',
        };
      default:
        return defaultStyle;
    }
  }, [type, theme]);

  return (
    <Text style={[textStyles, style]} {...rest}>
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