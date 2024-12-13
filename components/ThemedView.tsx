import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  fullScreen?: boolean;
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  fullScreen = false,
  ...otherProps 
}: ThemedViewProps) {
  const { theme } = useTheme();
  const backgroundColor = lightColor || darkColor || theme.colors.background;

  return (
    <View 
      style={[
        {
          backgroundColor,
          flex: fullScreen ? 1 : undefined,
          width: fullScreen ? '100%' : undefined,
          height: fullScreen ? '100%' : undefined,
        },
        style
      ]} 
      {...otherProps} 
    />
  );
}