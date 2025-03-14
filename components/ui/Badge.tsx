import React from 'react';
import { View, Text, ViewProps, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useThemedStyles } from '@/src/theme/utils';

export type BadgeVariant = 'primary' | 'success' | 'error' | 'warning' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends ViewProps {
  /**
   * The variant of the badge
   */
  variant?: BadgeVariant;
  
  /**
   * The size of the badge
   */
  size?: BadgeSize;
  
  /**
   * The content of the badge
   */
  label?: string | number;
  
  /**
   * Whether the badge is a dot (no content)
   */
  dot?: boolean;
  
  /**
   * Additional styles for the badge container
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Additional styles for the badge text
   */
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Badge component for displaying status indicators or counters
 */
export function Badge({
  variant = 'primary',
  size = 'md',
  label,
  dot = false,
  style,
  textStyle,
  ...rest
}: BadgeProps) {
  const styles = useThemedStyles((theme) => {
    // Safely access theme properties with fallbacks
    const primaryColor = theme?.colors?.primary?.main || '#F46315';
    const successColor = theme?.colors?.status?.success?.content || '#10B981';
    const errorColor = theme?.colors?.status?.error?.content || '#EF4444';
    const warningColor = theme?.colors?.status?.warning?.content || '#F59E0B';
    const infoColor = theme?.colors?.status?.info?.content || '#3B82F6';
    
    // Size mappings
    const sizeMap = {
      sm: {
        minWidth: dot ? 8 : 16,
        height: dot ? 8 : 16,
        fontSize: theme?.typography?.size?.xs || 10,
        paddingHorizontal: dot ? 0 : 4,
      },
      md: {
        minWidth: dot ? 10 : 20,
        height: dot ? 10 : 20,
        fontSize: theme?.typography?.size?.xs || 12,
        paddingHorizontal: dot ? 0 : 6,
      },
      lg: {
        minWidth: dot ? 12 : 24,
        height: dot ? 12 : 24,
        fontSize: theme?.typography?.size?.sm || 14,
        paddingHorizontal: dot ? 0 : 8,
      },
    };
    
    // Color mappings
    const colorMap = {
      primary: primaryColor,
      success: successColor,
      error: errorColor,
      warning: warningColor,
      info: infoColor,
    };
    
    const backgroundColor = colorMap[variant];
    
    return {
      badge: {
        backgroundColor,
        minWidth: sizeMap[size].minWidth,
        height: sizeMap[size].height,
        borderRadius: sizeMap[size].height / 2,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: sizeMap[size].paddingHorizontal,
      },
      text: {
        color: '#FFFFFF',
        fontSize: sizeMap[size].fontSize,
        fontWeight: '600',
        textAlign: 'center',
      },
    };
  });
  
  return (
    <View style={[styles.badge, style]} {...rest}>
      {!dot && label !== undefined && (
        <Text style={[styles.text, textStyle]} numberOfLines={1}>
          {typeof label === 'number' && label > 99 ? '99+' : label}
        </Text>
      )}
    </View>
  );
}

export default React.memo(Badge); 