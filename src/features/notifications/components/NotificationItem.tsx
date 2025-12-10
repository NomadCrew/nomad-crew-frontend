import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button, Surface, Avatar, Divider, Icon } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { formatDistanceToNow } from 'date-fns';
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
import { useNotificationStore } from '../store/useNotificationStore';
import { router } from 'expo-router';
import { weatherCodeToName } from '../../../utils/weather';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
  const theme = useAppTheme().theme;
  const notificationStore = useNotificationStore();

  const formattedTime = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  }, [notification.createdAt]);

  const handleMarkAsRead = async () => {
    await notificationStore.markNotificationRead(notification.id);
  };

  const handlePress = () => {
    // Mark notification as read when pressed
    handleMarkAsRead();

    // Handle navigation based on notification type
    // Note: Trip invitations should NOT navigate to trip - user must accept first via buttons
    if (isTripUpdateNotification(notification) || isMemberAddedNotification(notification)) {
      // Navigate to the trip screen (user is already a member)
      router.push(`/trip/${notification.metadata.tripID}`);
    } else if (isChatMessageNotification(notification)) {
      // Navigate to the chat screen
      router.push(`/trip/${notification.metadata.chatID}/chat`);
    }
    // Trip invitations: Don't navigate on tap - user should use Accept/Decline buttons

    // Call the onPress handler if provided
    if (onPress) {
      onPress();
    }
  };

  const handleAccept = async (notification: TripInvitationNotification) => {
    await notificationStore.acceptTripInvitation(notification);
    // Navigate to the trip screen after accepting (now user is a member)
    router.push(`/trip/${notification.metadata.tripID}`);
  };

  const handleDecline = async (notification: TripInvitationNotification) => {
    await notificationStore.declineTripInvitation(notification);
  };

  // Decide which icon to show based on notification type
  const getNotificationIcon = () => {
    if (isTripInvitationNotification(notification)) return 'account-plus';
    if (isTripUpdateNotification(notification)) return 'map-marker-path';
    if (isMemberAddedNotification(notification)) return 'account-group';
    if (isChatMessageNotification(notification)) return 'chat';
    return 'bell'; // Default
  };

  // Decide icon color
  const getIconColor = () => {
    if (isTripInvitationNotification(notification)) return theme.colors.primary.main;
    if (isTripUpdateNotification(notification)) return theme.colors.primary.main;
    if (isMemberAddedNotification(notification)) return theme.colors.primary.main;
    if (isChatMessageNotification(notification)) return theme.colors.primary.main;
    return theme.colors.text.primary;
  };

  const renderContent = () => {
    if (isTripInvitationNotification(notification)) {
      return renderTripInvite(notification);
    } else if (isTripUpdateNotification(notification)) {
      return renderTripUpdate(notification);
    } else if (isMemberAddedNotification(notification)) {
      return renderMember(notification);
    } else if (isChatMessageNotification(notification)) {
      return renderChat(notification);
    }

    // Generic notification rendering
    return (
      <View>
        <Text variant="titleMedium">Notification</Text>
        <Text variant="bodyMedium">{notification.message}</Text>
      </View>
    );
  };

  const renderTripInvite = (invite: TripInvitationNotification) => {
    return (
      <View>
        <Text variant="titleMedium">Trip Invitation</Text>
        <Text variant="bodyMedium">
          <Text style={{ fontWeight: 'bold' }}>{invite.metadata.inviterName}</Text> has invited you
          to join <Text style={{ fontWeight: 'bold' }}>{invite.metadata.tripName}</Text>
        </Text>
        {invite.message && (
          <Text variant="bodyMedium" style={styles.message}>
            "{invite.message}"
          </Text>
        )}

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={() => handleAccept(invite)}
            style={styles.actionButton}
            buttonColor={theme.colors.primary.main}
            loading={notificationStore.isHandlingAction}
            disabled={notificationStore.isHandlingAction}
          >
            Accept
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleDecline(invite)}
            style={styles.actionButton}
            loading={notificationStore.isHandlingAction}
            disabled={notificationStore.isHandlingAction}
          >
            Decline
          </Button>
        </View>
      </View>
    );
  };

  const renderTripUpdate = (tripUpdate: TripUpdateNotification) => {
    return (
      <View>
        <Text variant="titleMedium">Trip Updated</Text>
        <Text variant="bodyMedium">
          <Text style={{ fontWeight: 'bold' }}>{tripUpdate.metadata.updaterName}</Text> updated{' '}
          <Text style={{ fontWeight: 'bold' }}>{tripUpdate.metadata.tripName}</Text>
        </Text>
        {tripUpdate.metadata.changedFields.length > 0 && (
          <Text variant="bodySmall" style={styles.detailText}>
            Changed: {tripUpdate.metadata.changedFields.join(', ')}
          </Text>
        )}
      </View>
    );
  };

  const renderMember = (member: MemberAddedNotification) => {
    return (
      <View>
        <Text variant="titleMedium">New Member Added</Text>
        <Text variant="bodyMedium">
          <Text style={{ fontWeight: 'bold' }}>{member.metadata.adderUserName}</Text> added{' '}
          <Text style={{ fontWeight: 'bold' }}>{member.metadata.addedUserName}</Text> to{' '}
          <Text style={{ fontWeight: 'bold' }}>{member.metadata.tripName}</Text>
        </Text>
      </View>
    );
  };

  const renderChat = (chat: ChatMessageNotification) => {
    return (
      <View>
        <Text variant="titleMedium">New Message</Text>
        <Text variant="bodyMedium">
          <Text style={{ fontWeight: 'bold' }}>{chat.metadata.senderName}</Text>
        </Text>
        <Text variant="bodyMedium" style={styles.message} numberOfLines={2} ellipsizeMode="tail">
          {chat.metadata.messagePreview}
        </Text>
      </View>
    );
  };

  return (
    <Surface
      style={[
        styles.container,
        {
          backgroundColor: notification.read
            ? theme.colors.surface.default
            : theme.colors.primary.surface,
        },
      ]}
      elevation={1}
    >
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
          <Text variant="bodySmall" style={styles.timestamp}>
            {formattedTime}
          </Text>
        </View>
        {!notification.read && (
          <View style={styles.unreadIndicatorContainer}>
            <View
              style={[styles.unreadIndicator, { backgroundColor: theme.colors.primary.main }]}
            />
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
