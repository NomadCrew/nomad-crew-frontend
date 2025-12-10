import React from 'react';
import { View, ViewStyle, Pressable, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '../../../theme/utils/useAppTheme';
import { getStatusColor, getRoleColor } from '../../../theme/utils/colorHelpers';
import { spacing, iconSizes, componentSpacing } from '../../../theme/foundations/spacing';
import { getTiming, getMicroAnimation } from '../../../theme/foundations/animations';
import { PresenceIndicator } from '../PresenceIndicator';
import { RoleBadge } from '../RoleBadge';
import Stack from '../layout/Stack';
import Inline from '../layout/Inline';

import type { TripStatus, MemberRole, PresenceStatus } from '../../../types/app.types';

interface StatusAwareHeaderProps {
  /**
   * Header title
   */
  title: string;

  /**
   * Optional subtitle
   */
  subtitle?: string;

  /**
   * Navigation back handler
   */
  onBack?: () => void;

  /**
   * Trip context for status-aware styling
   */
  tripContext?: {
    status: TripStatus;
    memberCount: number;
    activeMembers: number;
  };

  /**
   * Current user role context
   */
  userRole?: MemberRole;

  /**
   * Current user presence status
   */
  presenceStatus?: PresenceStatus;

  /**
   * Action buttons for the header
   */
  actions?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    label?: string;
    disabled?: boolean;
    badge?: number;
  }[];

  /**
   * Whether to show status indicators
   * @default true
   */
  showStatusIndicators?: boolean;

  /**
   * Whether header should be sticky/elevated
   * @default false
   */
  elevated?: boolean;

  /**
   * Custom background color override
   */
  backgroundColor?: string;

  /**
   * Additional custom styles
   */
  style?: ViewStyle;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * StatusAwareHeader Component
 *
 * A navigation header that adapts its styling and indicators based on trip status,
 * user role, and presence status. Provides contextual information and actions.
 *
 * @example
 * ```tsx
 * <StatusAwareHeader
 *   title="Trip to Tokyo"
 *   subtitle="5 members • 3 active"
 *   tripContext={{
 *     status: 'active',
 *     memberCount: 5,
 *     activeMembers: 3
 *   }}
 *   userRole="admin"
 *   presenceStatus="online"
 *   onBack={() => navigation.goBack()}
 *   actions={[
 *     { icon: 'settings', onPress: openSettings },
 *     { icon: 'notifications', onPress: openNotifications, badge: 2 }
 *   ]}
 * />
 * ```
 */
export const StatusAwareHeader: React.FC<StatusAwareHeaderProps> = ({
  title,
  subtitle,
  onBack,
  tripContext,
  userRole,
  presenceStatus,
  actions,
  showStatusIndicators = true,
  elevated = false,
  backgroundColor,
  style,
  testID,
}) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const pressScale = useSharedValue(1);

  // Animation values for action buttons - create them conditionally based on actions length
  const actionCount = actions?.length || 0;
  const action0 = useSharedValue(1);
  const action1 = useSharedValue(1);
  const action2 = useSharedValue(1);
  const action3 = useSharedValue(1);
  const action4 = useSharedValue(1);
  const actionAnimations = [action0, action1, action2, action3, action4].slice(0, actionCount);

  // Get status-aware colors
  const statusColor = tripContext?.status
    ? getStatusColor(tripContext.status, theme.colors)
    : undefined;
  const roleColor = userRole ? getRoleColor(userRole, theme.colors) : undefined;

  // Create header container style
  const headerStyle: ViewStyle = {
    paddingTop: insets.top,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: backgroundColor || theme.colors.surface,
    borderBottomWidth: elevated ? 1 : 0,
    borderBottomColor: theme.colors.outline,
    ...(elevated && {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
    ...style,
  };

  // Back button animation
  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handleBackPress = () => {
    pressScale.value = withSpring(0.96, getTiming().spring.snappy);
    setTimeout(() => {
      pressScale.value = withSpring(1, getTiming().spring.snappy);
      onBack?.();
    }, 100);
  };

  // Action button animated styles
  const action0AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: action0.value }],
  }));
  const action1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: action1.value }],
  }));
  const action2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: action2.value }],
  }));
  const action3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: action3.value }],
  }));
  const action4AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: action4.value }],
  }));
  const actionAnimatedStyles = [
    action0AnimatedStyle,
    action1AnimatedStyle,
    action2AnimatedStyle,
    action3AnimatedStyle,
    action4AnimatedStyle,
  ];

  const handleActionPress = (onPress: () => void, index: number) => {
    if (actionAnimations[index]) {
      actionAnimations[index].value = withSpring(0.9, getTiming().spring.snappy);
      setTimeout(() => {
        actionAnimations[index].value = withSpring(1, getTiming().spring.snappy);
        onPress();
      }, 100);
    } else {
      onPress();
    }
  };

  // Render status indicators
  const renderStatusIndicators = () => {
    if (!showStatusIndicators) return null;

    return (
      <Inline space="sm" align="center">
        {tripContext?.status && (
          <View
            style={[
              {
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: statusColor,
              },
            ]}
          />
        )}

        {userRole && (
          <RoleBadge role={userRole} size="sm" showIcon={false} style={{ marginHorizontal: 0 }} />
        )}

        {presenceStatus && (
          <PresenceIndicator
            status={presenceStatus}
            size="sm"
            showPulse={presenceStatus === 'online'}
          />
        )}
      </Inline>
    );
  };

  // Render action buttons
  const renderActions = () => {
    if (!actions?.length) return null;

    return (
      <Inline space="xs">
        {actions.map((action, index) => (
          <Animated.View
            key={`action-${index}`}
            style={index < actionAnimatedStyles.length ? actionAnimatedStyles[index] : undefined}
          >
            <Pressable
              onPress={() => handleActionPress(action.onPress, index)}
              disabled={action.disabled}
              style={[
                {
                  padding: spacing.sm,
                  borderRadius: iconSizes.lg,
                  backgroundColor: action.disabled
                    ? theme.colors['surface-variant']
                    : 'transparent',
                },
              ]}
              accessibilityLabel={action.label || `Action ${index + 1}`}
              accessibilityRole="button"
            >
              <View>
                <Ionicons
                  name={action.icon}
                  size={iconSizes.lg}
                  color={action.disabled ? theme.colors.outline : theme.colors['on-surface']}
                />

                {action.badge && action.badge > 0 && (
                  <View
                    style={[
                      {
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: theme.colors.error,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                      },
                    ]}
                  >
                    <Text
                      variant="labelSmall"
                      style={{
                        color: theme.colors['on-error'],
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    >
                      {action.badge > 99 ? '99+' : action.badge.toString()}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </Inline>
    );
  };

  return (
    <View style={headerStyle} testID={testID}>
      <Inline justify="space-between" align="center">
        {/* Left side - Back button and title */}
        <Inline space="md" align="center" style={{ flex: 1 }}>
          {onBack && (
            <Animated.View style={backButtonAnimatedStyle}>
              <Pressable
                onPress={handleBackPress}
                style={[
                  {
                    padding: spacing.xs,
                    borderRadius: iconSizes.lg,
                  },
                ]}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <Ionicons
                  name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
                  size={iconSizes.lg}
                  color={theme.colors['on-surface']}
                />
              </Pressable>
            </Animated.View>
          )}

          <Stack space="xxs" style={{ flex: 1 }}>
            <Text
              variant="titleMedium"
              style={{
                color: theme.colors['on-surface'],
                fontWeight: '600',
              }}
              numberOfLines={1}
            >
              {title}
            </Text>

            {subtitle && (
              <Inline space="sm" align="center">
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors['on-surface-variant'],
                  }}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>

                {renderStatusIndicators()}
              </Inline>
            )}
          </Stack>
        </Inline>

        {/* Right side - Actions */}
        {renderActions()}
      </Inline>
    </View>
  );
};

// Export the StatusAwareHeader component as default
export default StatusAwareHeader;
