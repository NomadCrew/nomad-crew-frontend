import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button, Surface, Avatar, useTheme, Divider } from 'react-native-paper';
import { formatDistanceToNow } from 'date-fns';
import { 
  Notification, 
  TripInviteNotification, 
  isTripInviteNotification 
} from '../../types/notification';
import { useNotificationStore } from '../../store/useNotificationStore';
import { router } from 'expo-router';

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

  const renderContent = () => {
    if (isTripInviteNotification(notification)) {
      return renderTripInvite(notification);
    }
    
    // Generic notification rendering
    return (
      <View>
        <Text variant="titleMedium">{notification.title}</Text>
        <Text variant="bodyMedium">{notification.message}</Text>
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
          {isTripInviteNotification(notification) ? (
            <Avatar.Icon size={40} icon="account-plus" color={theme.colors.onPrimary} />
          ) : (
            <Avatar.Icon size={40} icon="bell" color={theme.colors.onPrimary} />
          )}
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
  statusText: {
    marginTop: 8,
    fontStyle: 'italic',
  },
}); 