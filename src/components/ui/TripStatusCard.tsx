/**
 * TripStatusCard - Status-aware trip card with animations
 * Displays trip information with status-based colors and smooth interactions
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useSemanticColors, useAnimationUtils, useComponentUtils } from '../../theme/utils';
import { FadeInView, SlideInView } from './animations/LoadingStates';
import type { TripStatus } from '../../theme/types';

interface TripStatusCardProps {
  tripId: string;
  title: string;
  description?: string;
  status: TripStatus;
  memberCount?: number;
  startDate?: Date;
  endDate?: Date;
  onPress?: () => void;
  onStatusChange?: (newStatus: TripStatus) => void;
  animated?: boolean;
  compact?: boolean;
}

export const TripStatusCard: React.FC<TripStatusCardProps> = ({
  tripId,
  title,
  description,
  status,
  memberCount = 0,
  startDate,
  endDate,
  onPress,
  onStatusChange,
  animated = true,
  compact = false,
}) => {
  const { theme } = useAppTheme();
  const semantic = useSemanticColors(theme);
  const animations = useAnimationUtils(theme);
  const components = useComponentUtils(theme);
  
  // Animation states
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Animation values
  const statusChangeAnim = useRef(new Animated.Value(1)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  // Status change animation
  useEffect(() => {
    if (animated) {
      Animated.sequence([
        Animated.timing(statusChangeAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(statusChangeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [status, animated, statusChangeAnim]);

  // Press animation
  useEffect(() => {
    if (animated) {
      Animated.timing(pressAnim, {
        toValue: isPressed ? 0.96 : 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [isPressed, animated, pressAnim]);

  // Get status colors
  const statusColors = semantic.getTripStatusColors(status);

  // Format dates
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'draft':
        return '📝';
      case 'planning':
        return '📋';
      case 'active':
        return '✈️';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '📝';
    }
  };

  // Get status label
  const getStatusLabel = () => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Handle press interactions
  const handlePressIn = () => {
    setIsPressed(true);
    setIsHovered(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    setIsHovered(false);
  };

  const cardStyle = components.card.getCardStyle(isHovered ? 'elevated' : 'default');

  return (
    <FadeInView animated={animated} duration={300}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={!onPress}
        style={{ opacity: onPress ? 1 : 0.9 }}
      >
        <Animated.View
          style={[
            cardStyle,
            {
              padding: compact ? 12 : 16,
              borderLeftWidth: 4,
              borderLeftColor: statusColors.border,
              backgroundColor: statusColors.background,
              transform: [
                { scale: animated ? statusChangeAnim : 1 },
                { scale: animated ? pressAnim : 1 },
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{
                  color: statusColors.content,
                  fontSize: compact ? 16 : 18,
                  fontWeight: '600',
                  marginBottom: 4,
                }}
                numberOfLines={compact ? 1 : 2}
              >
                {title}
              </Text>
              
              {description && !compact && (
                <Text
                  style={{
                    color: theme.colors.content.secondary,
                    fontSize: 14,
                    marginBottom: 8,
                    lineHeight: 20,
                  }}
                  numberOfLines={2}
                >
                  {description}
                </Text>
              )}
            </View>

            {/* Status Badge */}
            <SlideInView direction="left" animated={animated} delay={100}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: statusColors.border,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 10, marginRight: 4 }}>
                  {getStatusIcon()}
                </Text>
                <Text
                  style={{
                    color: statusColors.content,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  {getStatusLabel()}
                </Text>
              </View>
            </SlideInView>
          </View>

          {/* Trip Details */}
          {!compact && (
            <SlideInView direction="up" animated={animated} delay={200}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 }}>
                {/* Member Count */}
                {memberCount > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, marginRight: 4 }}>👥</Text>
                    <Text
                      style={{
                        color: theme.colors.content.secondary,
                        fontSize: 12,
                      }}
                    >
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </Text>
                  </View>
                )}

                {/* Dates */}
                {startDate && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, marginRight: 4 }}>📅</Text>
                    <Text
                      style={{
                        color: theme.colors.content.secondary,
                        fontSize: 12,
                      }}
                    >
                      {formatDate(startDate)}
                      {endDate && ` - ${formatDate(endDate)}`}
                    </Text>
                  </View>
                )}
              </View>
            </SlideInView>
          )}

          {/* Compact Footer */}
          {compact && (memberCount > 0 || startDate) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
              {memberCount > 0 && (
                <Text
                  style={{
                    color: theme.colors.content.tertiary,
                    fontSize: 11,
                  }}
                >
                  👥 {memberCount}
                </Text>
              )}
              {startDate && (
                <Text
                  style={{
                    color: theme.colors.content.tertiary,
                    fontSize: 11,
                  }}
                >
                  📅 {formatDate(startDate)}
                </Text>
              )}
            </View>
          )}

          {/* Interactive Status Indicator */}
          {status === 'active' && animated && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.colors.success?.main || '#10B981',
              }}
            >
              <Animated.View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.colors.success?.main || '#10B981',
                  opacity: statusChangeAnim.interpolate({
                    inputRange: [1, 1.05],
                    outputRange: [0.7, 1],
                  }),
                }}
              />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </FadeInView>
  );
}; 