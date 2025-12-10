import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Surface, Text, Avatar } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import {
  Notification,
  TripInvitationNotification,
  TripUpdateNotification,
  ChatMessageNotification,
  MemberAddedNotification,
  isTripInvitationNotification,
  isTripUpdateNotification,
  isChatMessageNotification,
  isMemberAddedNotification,
} from '../types/notification';
import { router } from 'expo-router';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NotificationToastProps {
  notification: Notification;
  duration?: number;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  duration = 5000,
  onDismiss,
}) => {
  const theme = useAppTheme().theme;
  const insets = useSafeAreaInsets();
  const notificationStore = useNotificationStore();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Set timeout to dismiss
    const id = setTimeout(() => {
      dismiss();
    }, duration);

    setTimeoutId(id);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const dismiss = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    // Clear timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Mark notification as read
    notificationStore.markNotificationRead(notification.id);

    // Navigate based on notification type
    if (isTripInvitationNotification(notification)) {
      // Navigate to notifications screen for trip invites
      router.push('/(authenticated)/(tabs)/notifications' as any);
    } else if (isTripUpdateNotification(notification) || isMemberAddedNotification(notification)) {
      // Navigate to the trip screen
      router.push(`/trip/${notification.metadata.tripID}`);
    } else if (isChatMessageNotification(notification)) {
      // Navigate to the chat screen
      router.push(`/trip/${notification.metadata.chatID}/chat`);
    } else {
      // Generic notification - go to notifications screen
      router.push('/(authenticated)/(tabs)/notifications' as any);
    }

    // Dismiss the toast
    dismiss();
  };

  // Decide which icon to show based on notification type
  const getNotificationIcon = () => {
    if (isTripInvitationNotification(notification)) return 'account-plus';
    if (isTripUpdateNotification(notification)) return 'map-marker-path';
    if (isMemberAddedNotification(notification)) return 'account-group';
    if (isChatMessageNotification(notification)) return 'chat';
    return 'bell'; // Default
  };

  const renderIcon = () => {
    return (
      <Avatar.Icon
        size={40}
        icon={getNotificationIcon()}
        color={theme.colors.text.onPrimary}
        style={{ backgroundColor: theme.colors.primary.main }}
      />
    );
  };

  const renderContent = () => {
    if (isTripInvitationNotification(notification)) {
      return (
        <View>
          <Text variant="titleMedium">Trip Invitation</Text>
          <Text variant="bodyMedium" numberOfLines={2}>
            <Text style={{ fontWeight: 'bold' }}>{notification.metadata.inviterName}</Text> has
            invited you to join{' '}
            <Text style={{ fontWeight: 'bold' }}>{notification.metadata.tripName}</Text>
          </Text>
        </View>
      );
    }

    if (isTripUpdateNotification(notification)) {
      return (
        <View>
          <Text variant="titleMedium">Trip Updated</Text>
          <Text variant="bodyMedium" numberOfLines={2}>
            <Text style={{ fontWeight: 'bold' }}>{notification.metadata.updaterName}</Text> updated{' '}
            {notification.metadata.tripName}
          </Text>
        </View>
      );
    }

    if (isMemberAddedNotification(notification)) {
      return (
        <View>
          <Text variant="titleMedium">Member Added</Text>
          <Text variant="bodyMedium" numberOfLines={2}>
            <Text style={{ fontWeight: 'bold' }}>{notification.metadata.adderUserName}</Text> added{' '}
            <Text style={{ fontWeight: 'bold' }}>{notification.metadata.addedUserName}</Text> to{' '}
            {notification.metadata.tripName}
          </Text>
        </View>
      );
    }

    if (isChatMessageNotification(notification)) {
      return (
        <View>
          <Text variant="titleMedium">New Message</Text>
          <Text variant="bodyMedium" numberOfLines={2}>
            <Text style={{ fontWeight: 'bold' }}>{notification.metadata.senderName}</Text>:{' '}
            {notification.metadata.messagePreview}
          </Text>
        </View>
      );
    }

    // Generic notification
    return (
      <View>
        <Text variant="titleMedium">Notification</Text>
        <Text variant="bodyMedium" numberOfLines={2}>
          {notification.message}
        </Text>
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          marginTop: insets.top,
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
        <Surface style={styles.surface} elevation={4}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>{renderIcon()}</View>
            <View style={styles.textContainer}>{renderContent()}</View>
          </View>
        </Surface>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: 16,
  },
  surface: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
});
