import React from 'react';
import { View, ViewProps, ColorValue, Pressable } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';

export interface ThemedViewProps extends ViewProps {
  lightColor?: ColorValue;
  darkColor?: ColorValue;
  fullScreen?: boolean;
  elevationLevel?: number;
  onPress?: () => void;
}

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  fullScreen = false,
  elevationLevel,
  onPress,
  ...otherProps 
}: ThemedViewProps) {
  const { theme, mode } = useTheme();

  const backgroundColor = React.useMemo(() => {
    if (mode === 'light' && lightColor) return lightColor;
    if (mode === 'dark' && darkColor) return darkColor;
    return theme.colors.background.default;
  }, [mode, lightColor, darkColor, theme.colors.background.default]);

  const elevation = React.useMemo(() => {
    if (typeof elevationLevel === 'number') {
      const key = `level${elevationLevel}` as keyof typeof theme.elevation;
      return theme.elevation[key] || undefined;
    }
    return undefined;
  }, [elevationLevel, theme.elevation]);

  const content = (
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

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export default React.memo(ThemedView);