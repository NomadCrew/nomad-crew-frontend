import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Calendar, Users, Bell, LucideIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import {
  Notification,
  isChatMessageNotification,
  isTripUpdateNotification,
  isMemberAddedNotification,
} from '../types/notification';
import { useNotificationStore } from '../store/useNotificationStore';

interface ActivityItemProps {
  notification: Notification;
  onPress?: () => void;
}

interface ActivityConfig {
  icon: LucideIcon;
  iconColor: string;
  iconBackgroundColor: string;
  title: string;
  description: string;
}

/**
 * A compact card for activity notifications (non-invitation types).
 * Renders different icons and content based on notification type:
 * - CHAT_MESSAGE: Chat bubble icon, blue
 * - TRIP_UPDATE: Calendar icon, yellow
 * - MEMBER_ADDED: Users icon, green
 * - Default: Bell icon, gray
 */
export const ActivityItem: React.FC<ActivityItemProps> = ({ notification, onPress }) => {
  const { theme } = useAppTheme();
  const { markNotificationRead } = useNotificationStore();

  const formattedTime = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
    } catch {
      return 'recently';
    }
  }, [notification.createdAt]);

  // Get notification configuration based on type
  const config: ActivityConfig = useMemo(() => {
    if (isChatMessageNotification(notification)) {
      return {
        icon: MessageCircle,
        iconColor: '#3B82F6', // Blue
        iconBackgroundColor: '#EFF6FF',
        title: notification.metadata.senderName,
        description: notification.metadata.messagePreview,
      };
    }

    if (isTripUpdateNotification(notification)) {
      return {
        icon: Calendar,
        iconColor: '#F59E0B', // Yellow/Amber
        iconBackgroundColor: '#FFFBEB',
        title: `${notification.metadata.tripName} updated`,
        description:
          notification.metadata.changedFields.length > 0
            ? `Changed: ${notification.metadata.changedFields.join(', ')}`
            : 'Trip details have been modified',
      };
    }

    if (isMemberAddedNotification(notification)) {
      return {
        icon: Users,
        iconColor: '#10B981', // Green
        iconBackgroundColor: '#ECFDF5',
        title: 'New member joined',
        description: `${notification.metadata.addedUserName} joined ${notification.metadata.tripName}`,
      };
    }

    // Default/generic notification
    return {
      icon: Bell,
      iconColor: theme.colors.content.secondary,
      iconBackgroundColor: theme.colors.surface.variant,
      title: 'Notification',
      description: notification.message,
    };
  }, [notification, theme]);

  const handlePress = async () => {
    // Mark as read
    if (!notification.read) {
      await markNotificationRead(notification.id);
    }

    // Navigate based on type
    if (isChatMessageNotification(notification)) {
      router.push(`/trip/${notification.metadata.chatID}/chat`);
    } else if (isTripUpdateNotification(notification) || isMemberAddedNotification(notification)) {
      router.push(`/trip/${notification.metadata.tripID}`);
    }

    // Call custom handler if provided
    onPress?.();
  };

  const IconComponent = config.icon;
  const themedStyles = styles(theme);

  return (
    <Pressable onPress={handlePress}>
      <Surface
        style={[themedStyles.container, !notification.read && themedStyles.unreadContainer]}
        elevation={1}
      >
        {/* Icon */}
        <View style={[themedStyles.iconContainer, { backgroundColor: config.iconBackgroundColor }]}>
          <IconComponent size={20} color={config.iconColor} />
        </View>

        {/* Content */}
        <View style={themedStyles.content}>
          <View style={themedStyles.headerRow}>
            <Text variant="titleSmall" style={themedStyles.title} numberOfLines={1}>
              {config.title}
            </Text>
            {!notification.read && <View style={themedStyles.unreadDot} />}
          </View>
          <Text
            variant="bodySmall"
            style={themedStyles.description}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {config.description}
          </Text>
          <Text variant="labelSmall" style={themedStyles.timestamp}>
            {formattedTime}
          </Text>
        </View>
      </Surface>
    </Pressable>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      padding: theme.spacing.inset.sm,
      borderRadius: 8,
      marginBottom: theme.spacing.stack.xs,
      backgroundColor: theme.colors.surface.default,
    },
    unreadContainer: {
      backgroundColor: theme.colors.surface.variant,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.inline.sm,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      color: theme.colors.content.primary,
      fontWeight: '600',
      flex: 1,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary.main,
      marginLeft: theme.spacing.inline.xs,
    },
    description: {
      color: theme.colors.content.secondary,
      marginTop: 2,
    },
    timestamp: {
      color: theme.colors.content.tertiary,
      marginTop: 4,
    },
  });
