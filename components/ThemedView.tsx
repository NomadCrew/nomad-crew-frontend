import React from 'react';
import { View, ViewProps, ColorValue } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';

export interface ThemedViewProps extends ViewProps {
  lightColor?: ColorValue;
  darkColor?: ColorValue;
  fullScreen?: boolean;
  elevationLevel?: number;
}

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  fullScreen = false,
  elevationLevel,
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
      // Type-safe lookup of elevation levels
      const key = `level${elevationLevel}` as keyof typeof theme.elevation;
      return theme.elevation[key] || undefined;
    }
    return undefined;
  }, [elevationLevel, theme.elevation]);

  return (
    <View 
      style={[
        {
          backgroundColor,
          flex: fullScreen ? 1 : undefined,
          width: fullScreen ? '100%' : undefined,
          height: fullScreen ? '100%' : undefined,
        },
        elevation,
        style
      ]} 
      {...otherProps} 
    />
  );
}

export default React.memo(ThemedView);