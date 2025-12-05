/**
 * EnhancedButton - Enhanced button component with animations and semantic variants
 * Combines theme colors, animations, and interaction states for a complete button system
 */

import React, { useRef, useEffect, useState } from 'react';
import { TouchableOpacity, Text, View, Animated, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useComponentUtils, useAnimationUtils } from '../../theme/utils';
import type { TripStatus, MemberRole } from '../../theme/types';

interface EnhancedButtonProps {
  // Content
  title: string;
  subtitle?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  
  // Behavior
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  
  // Styling
  variant?: 'primary' | 'secondary' | 'outlined' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  
  // Semantic variants
  tripStatus?: TripStatus;
  memberRole?: MemberRole;
  
  // Animation
  animated?: boolean;
  hapticFeedback?: boolean;
  
  // Badge/notification
  badge?: number;
  showBadge?: boolean;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  title,
  subtitle,
  icon,
  iconPosition = 'left',
  onPress,
  onLongPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  tripStatus,
  memberRole,
  animated = true,
  hapticFeedback = true,
  badge,
  showBadge = false,
}) => {
  const { theme } = useAppTheme();
  const components = useComponentUtils(theme);
  const animations = useAnimationUtils(theme);
  
  // Animation state
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;

  // Press animation
  useEffect(() => {
    if (animated && !disabled) {
      const config = animations.getMicroAnimation('buttonPress');
      Animated.timing(scaleAnim, {
        toValue: isPressed ? config.scale : 1,
        duration: config.duration,
        useNativeDriver: true,
      }).start();
      
      Animated.timing(opacityAnim, {
        toValue: isPressed ? config.opacity : 1,
        duration: config.duration,
        useNativeDriver: true,
      }).start();
    }
  }, [isPressed, animated, disabled, scaleAnim, opacityAnim, animations]);

  // Badge animation
  useEffect(() => {
    if (animated && showBadge && badge && badge > 0) {
      Animated.spring(badgeAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 250,
        mass: 0.8,
        useNativeDriver: true,
      }).start();
    } else {
      badgeAnim.setValue(0);
    }
  }, [showBadge, badge, animated, badgeAnim]);

  // Size configurations
  const sizeConfig = {
    sm: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      fontSize: 14,
      iconSize: 14,
      borderRadius: 8,
      minHeight: 32,
    },
    md: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      iconSize: 16,
      borderRadius: 10,
      minHeight: 44,
    },
    lg: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      fontSize: 18,
      iconSize: 18,
      borderRadius: 12,
      minHeight: 52,
    },
    xl: {
      paddingVertical: 20,
      paddingHorizontal: 24,
      fontSize: 20,
      iconSize: 20,
      borderRadius: 14,
      minHeight: 60,
    },
  };

  const config = sizeConfig[size];

  // Get button style based on variant and semantic context
  const getButtonStyle = () => {
    if (disabled) {
      return {
        backgroundColor: theme.colors.surface.variant,
        borderColor: 'transparent',
        borderWidth: 0,
      };
    }

    if (loading) {
      return {
        backgroundColor: theme.colors.surface.variant,
        borderColor: 'transparent',
        borderWidth: 0,
      };
    }

    // Semantic variants take precedence
    if (tripStatus) {
      const statusColors = components.getTripStatusColors?.(tripStatus);
      if (statusColors) {
        return {
          backgroundColor: statusColors.background,
          borderColor: statusColors.border,
          borderWidth: variant === 'outlined' ? 1 : 0,
        };
      }
    }

    if (memberRole) {
      const roleColors = components.getMemberRoleColors?.(memberRole);
      if (roleColors) {
        return {
          backgroundColor: roleColors.background,
          borderColor: roleColors.border,
          borderWidth: variant === 'outlined' ? 1 : 0,
        };
      }
    }

    // Standard variants
    return components.button.getButtonStyle(variant, size);
  };

  // Get text color
  const getTextColor = () => {
    if (disabled || loading) {
      return theme.colors.content.disabled || theme.colors.content.tertiary;
    }

    if (tripStatus) {
      const statusColors = components.getTripStatusColors?.(tripStatus);
      if (statusColors) return statusColors.content;
    }

    if (memberRole) {
      const roleColors = components.getMemberRoleColors?.(memberRole);
      if (roleColors) return roleColors.content;
    }

    switch (variant) {
      case 'primary':
        return theme.colors.primary.text;
      case 'destructive':
        return theme.colors.error?.content || '#FFFFFF';
      case 'outlined':
      case 'ghost':
        return theme.colors.primary.main;
      default:
        return theme.colors.content.primary;
    }
  };

  // Handle press events
  const handlePressIn = () => {
    if (!disabled && !loading) {
      setIsPressed(true);
      setIsHovered(true);
    }
  };

  const handlePressOut = () => {
    setIsPressed(false);
    setIsHovered(false);
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  const buttonStyle = getButtonStyle();
  const textColor = getTextColor();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled || loading}
      style={{
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
      }}
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: config.paddingVertical,
            paddingHorizontal: config.paddingHorizontal,
            borderRadius: config.borderRadius,
            minHeight: config.minHeight,
            position: 'relative',
          },
          buttonStyle,
          {
            transform: [{ scale: animated ? scaleAnim : 1 }],
            opacity: animated ? opacityAnim : 1,
          },
        ]}
      >
        {/* Loading indicator */}
        {loading && (
          <ActivityIndicator
            size="small"
            color={textColor}
            style={{ marginRight: title ? 8 : 0 }}
          />
        )}

        {/* Icon - Left */}
        {icon && iconPosition === 'left' && !loading && (
          <Text
            style={{
              fontSize: config.iconSize,
              marginRight: title ? 8 : 0,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {icon}
          </Text>
        )}

        {/* Content */}
        <View style={{ flex: fullWidth ? 1 : 0, alignItems: 'center' }}>
          <Text
            style={{
              color: textColor,
              fontSize: config.fontSize,
              fontWeight: '600',
              textAlign: 'center',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                color: textColor,
                fontSize: config.fontSize - 2,
                fontWeight: '400',
                textAlign: 'center',
                opacity: (disabled ? 0.5 : 1) * 0.8,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Icon - Right */}
        {icon && iconPosition === 'right' && !loading && (
          <Text
            style={{
              fontSize: config.iconSize,
              marginLeft: title ? 8 : 0,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {icon}
          </Text>
        )}

        {/* Badge */}
        {showBadge && badge && badge > 0 && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: -8,
                right: -8,
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: theme.colors.error?.main || '#EF4444',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 6,
              },
              {
                transform: [{ scale: animated ? badgeAnim : 1 }],
                opacity: animated ? badgeAnim : 1,
              },
            ]}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: '600',
              }}
            >
              {badge > 99 ? '99+' : badge.toString()}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}; 