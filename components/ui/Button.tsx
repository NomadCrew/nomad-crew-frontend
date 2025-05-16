import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  StyleSheet,
} from 'react-native';
import { useThemedStyles } from '@/src/theme/utils';
import { useTheme as useThemeProvider } from '@/src/theme/ThemeProvider';

export type ButtonVariant = 'filled' | 'outlined' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /**
   * The label text of the button
   */
  label: string;
  
  /**
   * The variant of the button
   */
  variant?: ButtonVariant;
  
  /**
   * The size of the button
   */
  size?: ButtonSize;
  
  /**
   * Whether the button is in a loading state
   */
  loading?: boolean;
  
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether the button should take up the full width of its container
   */
  fullWidth?: boolean;
  
  /**
   * Icon to display at the start of the button
   */
  startIcon?: React.ReactNode;
  
  /**
   * Icon to display at the end of the button
   */
  endIcon?: React.ReactNode;
  
  /**
   * Additional styles for the button container
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Additional styles for the button text
   */
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Button component for triggering actions
 */
export function Button({
  label,
  variant = 'filled',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  startIcon,
  endIcon,
  style,
  textStyle,
  onPress,
  ...rest
}: ButtonProps) {
  const { theme } = useThemeProvider();
  const _primaryHover = theme.colors.primary.hover;
  const _primarySurface = theme.colors.primary.surface;
  const _contentPrimary = theme.colors.content.primary;
  const _contentSecondary = theme.colors.content.secondary;
  const styles = useThemedStyles((theme) => {
    // Safely access theme properties with fallbacks
    const primaryColor = theme?.colors?.primary?.main || '#F46315';
    const primaryHover = theme?.colors?.primary?.hover || '#E05A0C';
    const primarySurface = theme?.colors?.primary?.surface || '#FFF7ED';
    const contentPrimary = theme?.colors?.content?.primary || '#1A1A1A';
    const contentSecondary = theme?.colors?.content?.secondary || '#6B7280';
    const contentDisabled = theme?.colors?.content?.disabled || '#9CA3AF';
    const surfaceDefault = theme?.colors?.surface?.default || '#FFFFFF';
    const borderDefault = theme?.colors?.border?.default || '#E5E7EB';
    const borderRadius = theme?.borderRadius?.md || 8;
    
    // Size mappings
    const sizeMap = {
      sm: {
        height: 32,
        paddingHorizontal: 12,
        fontSize: theme?.typography?.size?.sm || 14,
        iconSize: 16,
      },
      md: {
        height: 40,
        paddingHorizontal: 16,
        fontSize: theme?.typography?.size?.md || 16,
        iconSize: 18,
      },
      lg: {
        height: 48,
        paddingHorizontal: 20,
        fontSize: theme?.typography?.size?.lg || 18,
        iconSize: 20,
      },
    };
    
    // Get colors based on variant and state
    const getBackgroundColor = () => {
      if (disabled) return theme?.colors?.disabled?.background || surfaceDefault;
      return theme?.colors?.[variant]?.background || primarySurface;
    };
    
    const getBorderColor = () => {
      if (disabled) return theme?.colors?.disabled?.border || borderDefault;
      return variant === 'outlined' ? primaryColor : 'transparent';
    };
    
    const getTextColor = () => {
      if (disabled) return theme?.colors?.disabled?.text || contentDisabled;
      return theme?.colors?.[variant]?.text || primaryColor;
    };
    
    // Variant styles
    const getVariantStyles = () => {
      if (disabled) {
        return {
          backgroundColor: 'transparent',
          borderColor: getBorderColor(),
          borderWidth: variant === 'outlined' ? 1 : 0,
          color: getTextColor(),
        };
      }
      
      switch (variant) {
        case 'filled':
          return {
            backgroundColor: primaryColor,
            borderWidth: 0,
            color: '#FFFFFF',
          };
        case 'outlined':
          return {
            backgroundColor: 'transparent',
            borderColor: primaryColor,
            borderWidth: 1,
            color: primaryColor,
          };
        case 'ghost':
          return {
            backgroundColor: 'transparent',
            borderWidth: 0,
            color: primaryColor,
          };
        default:
          return {};
      }
    };
    
    const variantStyles = getVariantStyles();
    
    return {
      button: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        height: sizeMap[size].height,
        paddingHorizontal: sizeMap[size].paddingHorizontal,
        borderRadius: borderRadius,
        backgroundColor: getBackgroundColor(),
        borderWidth: variant === 'outlined' ? 1 : undefined,
        borderColor: getBorderColor(),
        opacity: loading ? 0.8 : 1,
        width: fullWidth ? '100%' as const : 'auto' as const,
      },
      label: {
        fontSize: sizeMap[size].fontSize,
        color: getTextColor(),
        fontWeight: '600' as const,
        textAlign: 'center' as const,
      },
      startIcon: {
        marginRight: 8,
      },
      endIcon: {
        marginLeft: 8,
      },
      loadingIndicator: {
        color: getTextColor(),
      },
    };
  });
  
  const isDisabled = disabled || loading;
  
  const getLoadingColor = () => {
    if (disabled) return styles.label.color;
    
    switch (variant) {
      case 'filled':
        return '#FFFFFF';
      case 'outlined':
      case 'ghost':
        return styles.label.color;
      default:
        return styles.label.color;
    }
  };
  
  const loadingSize = {
    sm: 16,
    md: 20,
    lg: 24,
  }[size];
  
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size={loadingSize} color={getLoadingColor()} />
      ) : (
        <>
          {startIcon && <View style={styles.startIcon}>{startIcon}</View>}
          <Text style={[styles.label, textStyle]} numberOfLines={1}>
            {label}
          </Text>
          {endIcon && <View style={styles.endIcon}>{endIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

export default React.memo(Button); 