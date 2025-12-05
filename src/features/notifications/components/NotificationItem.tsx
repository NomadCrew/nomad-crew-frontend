import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button, Surface, Avatar, Divider, Icon } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { formatDistanceToNow } from 'date-fns';
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
} from '../types/notification';
import { useNotificationStore } from '../store/useNotificationStore';
import { router } from 'expo-router';
import { weatherCodeToName } from '../../../utils/weather';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onPress 
}) => {
  const theme = useAppTheme().theme;
  const notificationStore = useNotificationStore();
  
  const formattedTime = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  }, [notification.timestamp]);

  const handleMarkAsRead = async () => {
    await notificationStore.markAsRead(notification.id);
  };

  const handlePress = () => {
    // Mark notification as read when pressed
    handleMarkAsRead();
    
    // Handle navigation based on notification type
    if (isTripInviteNotification(notification) || 
        isTripUpdateNotification(notification) || 
        isTodoNotification(notification) ||
        isMemberNotification(notification) ||
        isWeatherNotification(notification) ||
        isLocationNotification(notification)) {
      // Navigate to the trip screen
      router.push(`/trips/${notification.tripId}`);
    } else if (isChatNotification(notification)) {
      // Navigate to the chat screen
      router.push(`/trips/${notification.tripId}/chat`);
    }
    
    // Call the onPress handler if provided
    if (onPress) {
      onPress();
    }
  };
  
  const handleAccept = async (inviteId: string) => {
    await notificationStore.acceptTripInvite(inviteId);
    // Navigate to the trip screen after accepting
    router.push(`/trips/${(notification as TripInviteNotification).tripId}`);
  };
  
  const handleDecline = async (inviteId: string) => {
    await notificationStore.declineTripInvite(inviteId);
  };

  // Decide which icon to show based on notification type
  const getNotificationIcon = () => {
    if (isTripInviteNotification(notification)) return "account-plus";
    if (isTripUpdateNotification(notification)) return "map-marker-path";
    if (isTodoNotification(notification)) return "checkbox-marked-circle-outline";
    if (isMemberNotification(notification)) return "account-group";
    if (isWeatherNotification(notification)) return notification.type === 'WEATHER_ALERT' ? "weather-lightning" : "weather";
    if (isChatNotification(notification)) return "chat";
    if (isLocationNotification(notification)) return "map-marker";
    return "bell";  // Default
  };

  // Decide icon color
  const getIconColor = () => {
    if (isTripInviteNotification(notification)) return theme.colors.primary;
    if (isTripUpdateNotification(notification)) return theme.colors.primary;
    if (isTodoNotification(notification)) return theme.colors.secondary;
    if (isMemberNotification(notification)) return theme.colors.tertiary;
    if (isWeatherNotification(notification)) {
      return notification.type === 'WEATHER_ALERT' ? theme.colors.error : theme.colors.primary;
    }
    if (isChatNotification(notification)) return theme.colors.primary;
    if (isLocationNotification(notification)) return theme.colors.secondary;
    return theme.colors.onPrimary;
  };

  const renderContent = () => {
    if (isTripInviteNotification(notification)) {
      return renderTripInvite(notification);
    } else if (isTripUpdateNotification(notification)) {
      return renderTripUpdate(notification);
    } else if (isTodoNotification(notification)) {
      return renderTodo(notification);
    } else if (isMemberNotification(notification)) {
      return renderMember(notification);
    } else if (isWeatherNotification(notification)) {
      return renderWeather(notification);
    } else if (isChatNotification(notification)) {
      return renderChat(notification);
    } else if (isLocationNotification(notification)) {
      return renderLocation(notification);
    }
    
    // Generic notification rendering
    return (
      <View>
        <Text variant="titleMedium">{(notification as any).title}</Text>
        <Text variant="bodyMedium">{(notification as any).message}</Text>
      </View>
    );
  };
  
  const renderTripInvite = (invite: TripInviteNotification) => {
    return (
      <View>
        <Text variant="titleMedium">Trip Invitation</Text>
        <Text variant="bodyMedium">
          <Text style={{ fontWeight: 'bold' }}>{invite.inviterName}</Text> has invited you to join their trip
        </Text>
        {invite.message && (
          <Text variant="bodyMedium" style={styles.message}>
            "{invite.message}"
          </Text>
        )}
        
        {invite.status === 'pending' && (
          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              onPress={() => handleAccept(invite.inviteId)}
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              loading={notificationStore.loading}
              disabled={notificationStore.loading}
            >
              Accept
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => handleDecline(invite.inviteId)}
              style={styles.actionButton}
              loading={notificationStore.loading}
              disabled={notificationStore.loading}
            >
              Decline
            </Button>
          </View>
        )}
        
        {invite.status === 'accepted' && (
          <Text style={[styles.statusText, { color: theme.colors.primary }]}>
            You accepted this invitation
          </Text>
        )}
        
        {invite.status === 'declined' && (
          <Text style={[styles.statusText, { color: theme.colors.error }]}>
            You declined this invitation
          </Text>
        )}
      </View>
    );
  };

  const renderTripUpdate = (tripUpdate: TripUpdateNotification) => {
    if (tripUpdate.type === 'TRIP_STATUS') {
      return (
        <View>
          <Text variant="titleMedium">Trip Status Changed</Text>
          <Text variant="bodyMedium">
            <Text style={{ fontWeight: 'bold' }}>{tripUpdate.updaterName}</Text> changed the status of{' '}
            <Text style={{ fontWeight: 'bold' }}>{tripUpdate.tripName}</Text> from{' '}
            {tripUpdate.data.statusChange?.from} to{' '}
            <Text style={{ fontWeight: 'bold' }}>{tripUpdate.data.statusChange?.to}</Text>
          </Text>
        </View>
      );
    }
    
    return (
      <View>
        <Text variant="titleMedium">Trip Updated</Text>
        <Text variant="bodyMedium">
          <Text style={{ fontWeight: 'bold' }}>{tripUpdate.updaterName}</Text> updated{' '}
          <Text style={{ fontWeight: 'bold' }}>{tripUpdate.tripName}</Text>
        </Text>
        {tripUpdate.data.oldValue && tripUpdate.data.newValue && (
          <Text variant="bodySmall" style={styles.detailText}>
            Changed from "{tripUpdate.data.oldValue}" to "{tripUpdate.data.newValue}"
          </Text>
        )}
      </View>
    );
  };

  const renderTodo = (todo: TodoNotification) => {
    const getTitle = () => {
      switch (todo.type) {
        case 'TODO_CREATED': return 'New Todo Added';
        case 'TODO_UPDATED': return 'Todo Updated';
        case 'TODO_COMPLETED': return 'Todo Completed';
        default: return 'Todo Activity';
      }
    };
    
    return (
      <View>
        <Text variant="titleMedium">{getTitle()}</Text>
        <Text variant="bodyMedium">
          <Text style={{ fontWeight: 'bold' }}>{todo.creatorName}</Text>{' '}
          {todo.type === 'TODO_CREATED' ? 'created' : 
           todo.type === 'TODO_UPDATED' ? 'updated' : 'completed'} a todo
        </Text>
        <Text variant="bodyMedium" style={styles.todoText}>
          "{todo.todoText}"
        </Text>
        {todo.data?.assignedToName && (
          <Text variant="bodySmall" style={styles.detailText}>
            Assigned to {todo.data.assignedToName}
          </Text>
        )}
        {todo.data?.completedByName && (
          <Text variant="bodySmall" style={styles.detailText}>
            Completed by {todo.data.completedByName}
          </Text>
        )}
      </View>
    );
  };

  const renderMember = (member: MemberNotification) => {
    const getTitle = () => {
      switch (member.type) {
        case 'MEMBER_JOINED': return 'New Member Joined';
        case 'MEMBER_LEFT': return 'Member Left';
        case 'MEMBER_ROLE_CHANGED': return 'Member Role Changed';
        default: return 'Member Activity';
      }
    };
    
    return (
      <View>
        <Text variant="titleMedium">{getTitle()}</Text>
        <Text variant="bodyMedium">
          <Text style={{ fontWeight: 'bold' }}>{member.memberName}</Text>
          {member.type === 'MEMBER_JOINED' && ' has joined the trip!'}
          {member.type === 'MEMBER_LEFT' && ' has left the trip.'}
          {member.type === 'MEMBER_ROLE_CHANGED' && `'s role was changed to ${member.data.newRole}`}
        </Text>
        {member.data.changedByName && (
          <Text variant="bodySmall" style={styles.detailText}>
            By {member.data.changedByName}
          </Text>
        )}
      </View>
    );
  };

  const renderWeather = (weather: WeatherNotification) => {
    const getTitle = () => {
      switch (weather.type) {
        case 'WEATHER_ALERT': return 'Weather Alert!';
        case 'WEATHER_UPDATE': return 'Weather Update';
        default: return 'Weather Info';
      }
    };
    
    return (
      <View>
        <Text variant="titleMedium">{getTitle()}</Text>
        <Text variant="bodyMedium">
          {weather.data.location}: {weather.data.temp}°C, {weatherCodeToName(weather.data.weatherCode)}
        </Text>
        {weather.type === 'WEATHER_ALERT' && weather.data.alertDetails && (
          <Text variant="bodySmall" style={[styles.detailText, { color: theme.colors.error }]}>
            {weather.data.alertDetails}
          </Text>
        )}
      </View>
    );
  };

  const renderChat = (chat: ChatNotification) => {
    return (
      <View>
        <Text variant="titleMedium">New Message</Text>
        <Text variant="bodyMedium">
          <Text style={{ fontWeight: 'bold' }}>{chat.senderName}</Text> in{' '}
          <Text style={{ fontWeight: 'bold' }}>{chat.tripName}</Text>
        </Text>
        <Text variant="bodyMedium" style={styles.message} numberOfLines={2} ellipsizeMode="tail">
          {chat.messageText}
        </Text>
      </View>
    );
  };

  const renderLocation = (location: LocationNotification) => {
    return (
      <View>
        <Text variant="titleMedium">Location Update</Text>
        <Text variant="bodyMedium">
          {location.type === 'LOCATION_SHARED' ? 
            `${location.memberName} started sharing their location.` :
            `${location.memberName} stopped sharing their location.`
          }
        </Text>
      </View>
    );
  };

  return (
    <Surface style={[styles.container, { backgroundColor: notification.isRead ? theme.colors.surface : theme.colors.primaryContainer }]} elevation={1}>
      <TouchableOpacity onPress={handlePress} style={styles.touchableContent}>
        <View style={styles.iconContainer}>
          <Avatar.Icon 
            icon={getNotificationIcon()} 
            size={40} 
            style={{ backgroundColor: 'transparent' }} 
            color={getIconColor()}
          />
        </View>
        <View style={styles.contentContainer}>
          {renderContent()}
          <Text variant="bodySmall" style={styles.timestamp}>{formattedTime}</Text>
        </View>
        {!notification.isRead && (
          <View style={styles.unreadIndicatorContainer}>
            <View style={[styles.unreadIndicator, { backgroundColor: theme.colors.primary }]} />
          </View>
        )}
      </TouchableOpacity>
      <Divider />
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderRadius: 8,
  },
  touchableContent: {
    flexDirection: 'row',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  unreadIndicatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  message: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  todoText: {
    marginTop: 2,
  },
  detailText: {
    marginTop: 2,
    opacity: 0.8,
  },
  statusText: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  timestamp: {
    marginTop: 4,
    opacity: 0.7,
    alignSelf: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    marginRight: 8,
  },
}); 