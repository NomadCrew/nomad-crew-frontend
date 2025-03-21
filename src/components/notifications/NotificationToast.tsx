import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Surface, Text, Avatar, useTheme } from 'react-native-paper';
import { Notification, TripInviteNotification, isTripInviteNotification } from '../../types/notification';
import { router } from 'expo-router';
import { useNotificationStore } from '../../store/useNotificationStore';
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
  const theme = useTheme();
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
    notificationStore.markAsRead(notification.id);

    // Navigate based on notification type
    if (isTripInviteNotification(notification)) {
      // Navigate to notifications screen for trip invites
      router.push('/notifications');
    }

    // Dismiss the toast
    dismiss();
  };

  const renderIcon = () => {
    if (isTripInviteNotification(notification)) {
      return (
        <Avatar.Icon 
          size={40} 
          icon="account-plus" 
          color={theme.colors.onPrimary}
          style={{ backgroundColor: theme.colors.primary }}
        />
      );
    }
    
    return (
      <Avatar.Icon 
        size={40} 
        icon="bell" 
        color={theme.colors.onPrimary}
        style={{ backgroundColor: theme.colors.primary }}
      />
    );
  };

  const renderContent = () => {
    if (isTripInviteNotification(notification)) {
      const inviteNotification = notification as TripInviteNotification;
      return (
        <View>
          <Text variant="titleMedium">Trip Invitation</Text>
          <Text variant="bodyMedium" numberOfLines={2}>
            <Text style={{ fontWeight: 'bold' }}>{inviteNotification.inviterName}</Text> has invited you to join their trip
          </Text>
        </View>
      );
    }
    
    // Generic notification
    return (
      <View>
        <Text variant="titleMedium">{notification.title}</Text>
        <Text variant="bodyMedium" numberOfLines={2}>{notification.message}</Text>
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