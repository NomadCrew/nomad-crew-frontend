import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
  const { theme } = useTheme();
  
  const baseStyle = {
    color: theme.colors.onBackground,
    fontFamily: 'Inter',
    ...styles[type],
    fontSize: theme.typography.fontSize[type === 'title' ? '3xl' : type === 'subtitle' ? 'xl' : 'base'],
    lineHeight: theme.typography.lineHeight.normal,
  };

  return <Text style={[baseStyle, style]} {...rest} />;
}

const styles = StyleSheet.create({
  default: {
    fontWeight: '400',
  },
  defaultSemiBold: {
    fontWeight: '600',
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    fontWeight: '600',
  },
  link: {
    color: '#0a7ea4',
    textDecorationLine: 'underline',
  },
});