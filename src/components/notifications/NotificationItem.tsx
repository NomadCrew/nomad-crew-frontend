import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button, Surface, Avatar, useTheme, Divider, Icon } from 'react-native-paper';
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
} from '../../types/notification';
import { useNotificationStore } from '../../store/useNotificationStore';
import { router } from 'expo-router';
import { weatherCodeToName } from '../../utils/weather';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onPress 
}) => {
  const theme = useTheme();
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
        case 'MEMBER_ADDED': return 'New Member Added';
        case 'MEMBER_REMOVED': return 'Member Removed';
        case 'MEMBER_ROLE_UPDATED': return 'Member Role Changed';
        default: return 'Member Update';
      }
    };
    
    return (
      <View>
        <Text variant="titleMedium">{getTitle()}</Text>
        <Text variant="bodyMedium">
          {member.type === 'MEMBER_ADDED' ? (
            <>
              <Text style={{ fontWeight: 'bold' }}>{member.memberName}</Text> was added to{' '}
              <Text style={{ fontWeight: 'bold' }}>{member.tripName}</Text>
              {member.data?.actorName && ` by ${member.data.actorName}`}
            </>
          ) : member.type === 'MEMBER_REMOVED' ? (
            <>
              <Text style={{ fontWeight: 'bold' }}>{member.memberName}</Text> was removed from{' '}
              <Text style={{ fontWeight: 'bold' }}>{member.tripName}</Text>
              {member.data?.actorName && ` by ${member.data.actorName}`}
            </>
          ) : (
            <>
              <Text style={{ fontWeight: 'bold' }}>{member.memberName}</Text>'s role was changed to{' '}
              <Text style={{ fontWeight: 'bold' }}>{member.data?.role}</Text>
              {member.data?.previousRole && ` from ${member.data.previousRole}`}
            </>
          )}
        </Text>
      </View>
    );
  };

  const renderWeather = (weather: WeatherNotification) => {
    if (weather.type === 'WEATHER_ALERT') {
      return (
        <View>
          <Text variant="titleMedium" style={{ color: theme.colors.error }}>
            Weather Alert!
          </Text>
          <Text variant="bodyMedium">
            {weather.data.alertMessage || `${weather.data.alertType} alert for ${weather.tripLocation}`}
          </Text>
          <Text variant="bodySmall" style={styles.detailText}>
            Severity: {weather.data.alertSeverity}
          </Text>
        </View>
      );
    }
    
    return (
      <View>
        <Text variant="titleMedium">Weather Update</Text>
        <Text variant="bodyMedium">
          Current weather in <Text style={{ fontWeight: 'bold' }}>{weather.tripLocation}</Text>:{' '}
          {weather.data.weatherCode && weatherCodeToName(weather.data.weatherCode)}
          {weather.data.temperature && `, ${weather.data.temperature}°C`}
        </Text>
      </View>
    );
  };

  const renderChat = (chat: ChatNotification) => {
    return (
      <View>
        <Text variant="titleMedium">New Message</Text>
        <Text variant="bodyMedium">
          <Text style={{ fontWeight: 'bold' }}>{chat.senderName}</Text> sent a message
        </Text>
        {chat.data.messagePreview && (
          <Text variant="bodyMedium" style={styles.message} numberOfLines={2}>
            "{chat.data.messagePreview}"
          </Text>
        )}
      </View>
    );
  };

  const renderLocation = (location: LocationNotification) => {
    return (
      <View>
        <Text variant="titleMedium">Location Update</Text>
        <Text variant="bodyMedium">
          <Text style={{ fontWeight: 'bold' }}>{location.memberName}</Text> is now at{' '}
          {location.data.locationName || 'a new location'}
        </Text>
      </View>
    );
  };

  return (
    <Surface
      style={[
        styles.container,
        !notification.isRead && { backgroundColor: theme.colors.primaryContainer }
      ]}
      elevation={1}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.leftContent}>
          <Avatar.Icon 
            size={40} 
            icon={getNotificationIcon()} 
            style={{ backgroundColor: theme.colors.surfaceVariant }} 
            color={getIconColor()} 
          />
        </View>
        
        <View style={styles.mainContent}>
          {renderContent()}
          <Text variant="labelSmall" style={styles.time}>
            {formattedTime}
          </Text>
        </View>
      </TouchableOpacity>
      
      <Divider />
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  leftContent: {
    marginRight: 16,
  },
  mainContent: {
    flex: 1,
  },
  time: {
    marginTop: 8,
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    marginRight: 8,
  },
  message: {
    fontStyle: 'italic',
    marginTop: 4,
  },
  todoText: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  statusText: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  detailText: {
    marginTop: 4,
    opacity: 0.8,
  },
}); 