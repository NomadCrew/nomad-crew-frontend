/**
 * RoleBadge - Role-based badge component with animations
 * Displays member roles with semantic colors and smooth transitions
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useSemanticColors, useAnimationUtils } from '../../theme/utils';
import type { MemberRole } from '../../theme/types';

interface RoleBadgeProps {
  role: MemberRole;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outlined' | 'minimal';
  animated?: boolean;
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  variant = 'filled',
  animated = true,
  showIcon = true,
}) => {
  const { theme } = useAppTheme();
  const semantic = useSemanticColors(theme);
  const animations = useAnimationUtils(theme);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Mount animation
  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 250,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [animated, scaleAnim, opacityAnim]);

  // Role change animation
  useEffect(() => {
    if (animated) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [role, animated, scaleAnim]);

  // Get role colors
  const roleColors = semantic.getMemberRoleColors(role);

  // Size configurations
  const sizeConfig = {
    sm: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontSize: 10,
      iconSize: 8,
      borderRadius: 8,
    },
    md: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 12,
      iconSize: 10,
      borderRadius: 10,
    },
    lg: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: 14,
      iconSize: 12,
      borderRadius: 12,
    },
  };

  const config = sizeConfig[size];

  // Variant styles
  const getVariantStyle = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: roleColors.background,
          borderWidth: 0,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: roleColors.border,
        };
      case 'minimal':
        return {
          backgroundColor: theme.colors.surface.variant,
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: roleColors.background,
          borderWidth: 0,
        };
    }
  };

  // Role icons
  const getRoleIcon = () => {
    switch (role) {
      case 'owner':
        return '👑';
      case 'admin':
        return '⚡';
      case 'moderator':
        return '🛡️';
      case 'member':
        return '👤';
      case 'viewer':
        return '👁️';
      default:
        return '👤';
    }
  };

  // Role labels
  const getRoleLabel = () => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const variantStyle = getVariantStyle();
  const textColor = variant === 'outlined' || variant === 'minimal' 
    ? roleColors.content 
    : roleColors.content;

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: config.paddingHorizontal,
          paddingVertical: config.paddingVertical,
          borderRadius: config.borderRadius,
          alignSelf: 'flex-start',
        },
        variantStyle,
        {
          transform: [{ scale: animated ? scaleAnim : 1 }],
          opacity: animated ? opacityAnim : 1,
        },
      ]}
    >
      {showIcon && (
        <Text
          style={{
            fontSize: config.iconSize,
            marginRight: 4,
          }}
        >
          {getRoleIcon()}
        </Text>
      )}
      <Text
        style={{
          color: textColor,
          fontSize: config.fontSize,
          fontWeight: '600',
        }}
      >
        {getRoleLabel()}
      </Text>
    </Animated.View>
  );
}; 