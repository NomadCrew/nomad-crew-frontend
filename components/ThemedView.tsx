import React from 'react';
import { View, ViewProps, ColorValue, Pressable } from 'react-native';
import { _useTheme } from '@/src/theme/ThemeProvider';
import { _createStyles, useThemeAndStyles } from '@/src/theme/utils';

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
  // Use our new utility to get both theme and styles
  const { theme, mode, styles } = useThemeAndStyles((theme) => {
    // Get background color based on theme mode
    const backgroundColor = (() => {
      if (mode === 'light' && lightColor) return lightColor;
      if (mode === 'dark' && darkColor) return darkColor;
      return theme.colors.background.default;
    })();

    // Get elevation style if elevationLevel is provided
    const elevation = (() => {
      if (typeof elevationLevel === 'number') {
        const key = `level${elevationLevel}` as keyof typeof theme.elevation;
        return theme.elevation[key] || undefined;
      }
      return undefined;
    })();

    return {
      container: {
        backgroundColor,
        flex: fullScreen ? 1 : undefined,
        width: fullScreen ? '100%' : undefined,
        height: fullScreen ? '100%' : undefined,
        ...elevation,
      },
    };
  });

  const content = (
    <View 
      style={[styles.container, style]} 
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