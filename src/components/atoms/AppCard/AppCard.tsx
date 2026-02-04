import React from 'react';
import { View, ViewProps, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { useThemedStyles } from '@/src/theme/utils';

export interface AppCardProps extends ViewProps {
  /**
   * Elevation level of the card (0-5)
   */
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  
  /**
   * Whether the card has a border
   */
  bordered?: boolean;
  
  /**
   * Whether the card is pressable
   */
  onPress?: () => void;
  
  /**
   * Content of the card
   */
  children: React.ReactNode;
  
  /**
   * Additional styles for the card
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * @atomic-level atom
 * @description Card component for displaying content in a contained, elevated surface
 * @composition None - this is a base atom
 * @example
 * ```tsx
 * <AppCard elevation={2}>
 *   <Text>Card content</Text>
 * </AppCard>
 * 
 * <AppCard bordered onPress={handlePress}>
 *   <Text>Pressable card</Text>
 * </AppCard>
 * ```
 */
export function AppCard({
  elevation = 1,
  bordered = false,
  onPress,
  children,
  style,
  ...rest
}: AppCardProps) {
  const styles = useThemedStyles((theme) => {
    // Safely access theme properties with fallbacks
    const surfaceDefault = theme?.colors?.surface?.default || '#FFFFFF';
    const borderDefault = theme?.colors?.border?.default || '#E5E7EB';
    const borderRadiusMd = theme?.borderRadius?.md || 8;
    const spacingInsetMd = theme?.spacing?.inset?.md || 16;
    
    // Get elevation style based on level
    const getElevationStyle = () => {
      if (typeof elevation === 'number') {
        const key = `level${elevation}` as keyof typeof theme.elevation;
        return theme?.elevation?.[key] || {};
      }
      return {};
    };
    
    return {
      card: {
        backgroundColor: surfaceDefault,
        borderRadius: borderRadiusMd,
        padding: spacingInsetMd,
        ...(bordered ? { borderWidth: 1, borderColor: borderDefault } : {}),
        ...getElevationStyle(),
      },
    };
  });
  
  const CardComponent = (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {CardComponent}
      </TouchableOpacity>
    );
  }
  
  return CardComponent;
}

export default React.memo(AppCard);