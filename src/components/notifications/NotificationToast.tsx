import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Surface, Text, Avatar, useTheme } from 'react-native-paper';
import { 
  Notification, 
  TripInviteNotification, 
  TripUpdateNotification,
  TodoNotification,
  MemberNotification,
  WeatherNotification,
  ChatNotification,
  LocationNotification,
  isTripInviteNotification,
  isTripUpdateNotification,
  isTodoNotification,
  isMemberNotification,
  isWeatherNotification,
  isChatNotification,
  isLocationNotification
} from '../../types/notification';
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
    } else if (isTripUpdateNotification(notification) || 
               isTodoNotification(notification) || 
               isMemberNotification(notification) || 
               isWeatherNotification(notification) || 
               isLocationNotification(notification)) {
      // Navigate to the trip screen
      router.push(`/trips/${notification.tripId}`);
    } else if (isChatNotification(notification)) {
      // Navigate to the chat screen
      router.push(`/trips/${notification.tripId}/chat`);
    } else {
      // Generic notification - go to notifications screen
      router.push('/notifications');
    }

    // Dismiss the toast
    dismiss();
  };

  // Decide which icon to show based on notification type
  const getNotificationIcon = () => {
    if (isTripInviteNotification(notification)) return "account-plus";
    if (isTripUpdateNotification(notification)) return "map-marker-path";
    if (isTodoNotification(notification)) return "checkbox-marked-circle-outline";
    if (isMemberNotification(notification)) return "account-group";
    if (isWeatherNotification(notification)) {
      return notification.type === 'WEATHER_ALERT' ? "weather-lightning" : "weather";
    }
    if (isChatNotification(notification)) return "chat";
    if (isLocationNotification(notification)) return "map-marker";
    return "bell";  // Default
  };

  const renderIcon = () => {
    return (
      <Avatar.Icon 
        size={40} 
        icon={getNotificationIcon()}
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
    
    if (isTripUpdateNotification(notification)) {
      const updateNotification = notification as TripUpdateNotification;
      const title = updateNotification.type === 'TRIP_STATUS' ? 'Trip Status Changed' : 'Trip Updated';
      return (
        <View>
          <Text variant="titleMedium">{title}</Text>
          <Text variant="bodyMedium" numberOfLines={2}>
            <Text style={{ fontWeight: 'bold' }}>{updateNotification.updaterName}</Text> updated {updateNotification.tripName}
          </Text>
        </View>
      );
    }
    
    if (isTodoNotification(notification)) {
      const todoNotification = notification as TodoNotification;
      const action = todoNotification.type === 'TODO_CREATED' ? 'created' : 
                    todoNotification.type === 'TODO_UPDATED' ? 'updated' : 'completed';
      return (
        <View>
          <Text variant="titleMedium">Todo {action}</Text>
          <Text variant="bodyMedium" numberOfLines={2}>
            <Text style={{ fontWeight: 'bold' }}>{todoNotification.creatorName}</Text> {action} "{todoNotification.todoText}"
          </Text>
        </View>
      );
    }
    
    if (isMemberNotification(notification)) {
      const memberNotification = notification as MemberNotification;
      const action = memberNotification.type === 'MEMBER_ADDED' ? 'joined' : 
                    memberNotification.type === 'MEMBER_REMOVED' ? 'left' : 'changed role';
      return (
        <View>
          <Text variant="titleMedium">Member {action}</Text>
          <Text variant="bodyMedium" numberOfLines={2}>
            <Text style={{ fontWeight: 'bold' }}>{memberNotification.memberName}</Text> has {action} {memberNotification.tripName}
          </Text>
        </View>
      );
    }
    
    if (isWeatherNotification(notification)) {
      const weatherNotification = notification as WeatherNotification;
      const title = weatherNotification.type === 'WEATHER_ALERT' ? 'Weather Alert' : 'Weather Update';
      return (
        <View>
          <Text variant="titleMedium">{title}</Text>
          <Text variant="bodyMedium" numberOfLines={2}>
            {weatherNotification.type === 'WEATHER_ALERT' ? 
              (weatherNotification.data.alertMessage || `Alert for ${weatherNotification.tripLocation}`) : 
              `Weather update for ${weatherNotification.tripLocation}`}
          </Text>
        </View>
      );
    }
    
    if (isChatNotification(notification)) {
      const chatNotification = notification as ChatNotification;
      return (
        <View>
          <Text variant="titleMedium">New Message</Text>
          <Text variant="bodyMedium" numberOfLines={2}>
            <Text style={{ fontWeight: 'bold' }}>{chatNotification.senderName}</Text>: {chatNotification.data.messagePreview}
          </Text>
        </View>
      );
    }
    
    if (isLocationNotification(notification)) {
      const locationNotification = notification as LocationNotification;
      return (
        <View>
          <Text variant="titleMedium">Location Update</Text>
          <Text variant="bodyMedium" numberOfLines={2}>
            <Text style={{ fontWeight: 'bold' }}>{locationNotification.memberName}</Text> is now at {locationNotification.data.locationName || 'a new location'}
          </Text>
        </View>
      );
    }
    
    // Generic notification
    return (
      <View>
        <Text variant="titleMedium">{(notification as any).title}</Text>
        <Text variant="bodyMedium" numberOfLines={2}>{(notification as any).message}</Text>
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