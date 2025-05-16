import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useThemedStyles } from '@/src/theme/utils';
import { Ionicons } from '@expo/vector-icons';

export type ChipVariant = 'filled' | 'outlined' | 'ghost';
export type ChipSize = 'sm' | 'md' | 'lg';

export interface ChipProps {
  /**
   * The label text of the chip
   */
  label: string;
  
  /**
   * The variant of the chip
   */
  variant?: ChipVariant;
  
  /**
   * The size of the chip
   */
  size?: ChipSize;
  
  /**
   * Whether the chip is selected
   */
  selected?: boolean;
  
  /**
   * Whether the chip is disabled
   */
  disabled?: boolean;
  
  /**
   * Icon to display at the start of the chip
   */
  startIcon?: React.ReactNode;
  
  /**
   * Icon to display at the end of the chip
   */
  endIcon?: React.ReactNode;
  
  /**
   * Whether to show a close/remove icon
   */
  removable?: boolean;
  
  /**
   * Function to call when the chip is pressed
   */
  onPress?: () => void;
  
  /**
   * Function to call when the remove icon is pressed
   */
  onRemove?: () => void;
  
  /**
   * Additional styles for the chip container
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Additional styles for the chip text
   */
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Chip component for displaying compact elements like filters, options, or actions
 */
export function Chip({
  label,
  variant = 'filled',
  size = 'md',
  selected = false,
  disabled = false,
  startIcon,
  endIcon,
  removable = false,
  onPress,
  onRemove,
  style,
  textStyle,
}: ChipProps) {
  const styles = useThemedStyles((theme) => {
    // Safely access theme properties with fallbacks
    const primaryColor = theme?.colors?.primary?.main || '#F46315';
    const primarySurface = theme?.colors?.primary?.surface || '#FFF7ED';
    const contentPrimary = theme?.colors?.content?.primary || '#1A1A1A';
    const contentSecondary = theme?.colors?.content?.secondary || '#6B7280';
    const contentDisabled = theme?.colors?.content?.disabled || '#9CA3AF';
    const surfaceDefault = theme?.colors?.surface?.default || '#FFFFFF';
    const borderDefault = theme?.colors?.border?.default || '#E5E7EB';
    
    // Size mappings
    const sizeMap = {
      sm: {
        height: 24,
        paddingHorizontal: 8,
        fontSize: theme?.typography?.size?.xs || 12,
        iconSize: 14,
      },
      md: {
        height: 32,
        paddingHorizontal: 12,
        fontSize: theme?.typography?.size?.sm || 14,
        iconSize: 16,
      },
      lg: {
        height: 40,
        paddingHorizontal: 16,
        fontSize: theme?.typography?.size?.md || 16,
        iconSize: 18,
      },
    };
    
    // Variant styles
    const getVariantStyles = () => {
      if (disabled) {
        return {
          backgroundColor: variant === 'ghost' ? 'transparent' : surfaceDefault,
          borderColor: variant === 'outlined' ? borderDefault : 'transparent',
          borderWidth: variant === 'outlined' ? 1 : 0,
          color: contentDisabled,
        };
      }
      
      if (selected) {
        return {
          backgroundColor: variant === 'ghost' ? 'transparent' : primaryColor,
          borderColor: primaryColor,
          borderWidth: variant === 'outlined' ? 1 : 0,
          color: variant === 'filled' ? '#FFFFFF' : primaryColor,
        };
      }
      
      switch (variant) {
        case 'filled':
          return {
            backgroundColor: primarySurface,
            borderWidth: 0,
            color: primaryColor,
          };
        case 'outlined':
          return {
            backgroundColor: 'transparent',
            borderColor: borderDefault,
            borderWidth: 1,
            color: contentPrimary,
          };
        case 'ghost':
          return {
            backgroundColor: 'transparent',
            borderWidth: 0,
            color: contentSecondary,
          };
        default:
          return {};
      }
    };
    
    const variantStyles = getVariantStyles();
    
    return {
      chip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizeMap[size].height,
        paddingHorizontal: sizeMap[size].paddingHorizontal,
        borderRadius: sizeMap[size].height / 2,
        backgroundColor: variantStyles.backgroundColor,
        borderWidth: variantStyles.borderWidth,
        borderColor: variantStyles.borderColor,
        opacity: disabled ? 0.6 : 1,
      },
      label: {
        fontSize: sizeMap[size].fontSize,
        color: variantStyles.color,
        fontWeight: '500',
      },
      startIcon: {
        marginRight: 6,
      },
      endIcon: {
        marginLeft: 6,
      },
      removeIcon: {
        marginLeft: 4,
      },
    };
  });
  
  const handleRemove = (e: any) => {
    e.stopPropagation();
    onRemove?.();
  };
  
  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18,
  }[size];
  
  const content = (
    <>
      {startIcon && <View style={styles.startIcon}>{startIcon}</View>}
      <Text style={[styles.label as TextStyle, textStyle]} numberOfLines={1}>
        {label}
      </Text>
      {endIcon && <View style={styles.endIcon}>{endIcon}</View>}
      {removable && !disabled && (
        <TouchableOpacity style={styles.removeIcon} onPress={handleRemove}>
          <Ionicons name="close-circle" size={iconSize} color={styles.label.color} />
        </TouchableOpacity>
      )}
    </>
  );
  
  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        style={[styles.chip as ViewStyle, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }
  
  return <View style={[styles.chip as ViewStyle, style]}>{content}</View>;
}

export default React.memo(Chip); 