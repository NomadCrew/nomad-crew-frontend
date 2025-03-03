import React from 'react';
import { View, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { useThemedStyles } from '@/src/theme/utils';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerVariant = 'default' | 'strong' | 'dashed';

export interface DividerProps extends ViewProps {
  /**
   * The orientation of the divider
   */
  orientation?: DividerOrientation;
  
  /**
   * The variant of the divider
   */
  variant?: DividerVariant;
  
  /**
   * The thickness of the divider
   */
  thickness?: number;
  
  /**
   * Additional styles for the divider
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Divider component for separating content
 */
export function Divider({
  orientation = 'horizontal',
  variant = 'default',
  thickness,
  style,
  ...rest
}: DividerProps) {
  const styles = useThemedStyles((theme) => {
    // Safely access theme properties with fallbacks
    const borderDefault = theme?.colors?.border?.default || '#E5E7EB';
    const borderStrong = theme?.colors?.border?.strong || '#9CA3AF';
    
    // Variant mappings
    const variantMap = {
      default: {
        borderColor: borderDefault,
        borderStyle: 'solid',
      },
      strong: {
        borderColor: borderStrong,
        borderStyle: 'solid',
      },
      dashed: {
        borderColor: borderDefault,
        borderStyle: 'dashed',
      },
    };
    
    const thicknessValue = thickness || 1;
    
    return {
      divider: {
        ...(orientation === 'horizontal' 
          ? {
              width: '100%',
              height: thicknessValue,
              borderBottomWidth: thicknessValue,
            }
          : {
              height: '100%',
              width: thicknessValue,
              borderRightWidth: thicknessValue,
            }
        ),
        ...variantMap[variant],
      },
    };
  });
  
  return <View style={[styles.divider, style]} {...rest} />;
}

export default React.memo(Divider); 