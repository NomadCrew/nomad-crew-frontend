import { useNotificationStore } from '../store/useNotificationStore';
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Notification } from '../types/notification';

export const useTestNotifications = () => {
  const { handleIncomingNotification } = useNotificationStore();

  const addTripInviteNotification = useCallback(() => {
    const invitationID = uuidv4();
    const tripID = uuidv4();
    const inviterID = uuidv4();

    const notification: Notification = {
      id: uuidv4(),
      type: 'TRIP_INVITATION_RECEIVED',
      metadata: {
        invitationID,
        tripID,
        inviterID,
        inviterName: 'Test User',
        tripName: 'Test Trip to Barcelona',
      },
      message: 'You have been invited to join Test Trip to Barcelona!',
      createdAt: new Date().toISOString(),
      read: false,
    };

    handleIncomingNotification(notification);
  }, [handleIncomingNotification]);

  const addSystemNotification = useCallback(() => {
    const notification: Notification = {
      id: uuidv4(),
      type: 'UNKNOWN',
      metadata: {},
      message: 'This is a test system notification.',
      createdAt: new Date().toISOString(),
      read: false,
    };

    handleIncomingNotification(notification);
  }, [handleIncomingNotification]);

  const addChatNotification = useCallback(() => {
    const notification: Notification = {
      id: uuidv4(),
      type: 'CHAT_MESSAGE',
      metadata: {
        chatID: uuidv4(),
        messageID: uuidv4(),
        senderName: 'Test User',
        messagePreview: 'You have a new message from Test User.',
      },
      message: 'New message in chat',
      createdAt: new Date().toISOString(),
      read: false,
    };

    handleIncomingNotification(notification);
  }, [handleIncomingNotification]);

  const addTripUpdateNotification = useCallback(() => {
    const notification: Notification = {
      id: uuidv4(),
      type: 'TRIP_UPDATE',
      metadata: {
        tripID: uuidv4(),
        tripName: 'Barcelona Trip',
        updaterName: 'Trip Owner',
        changedFields: ['dates', 'location'],
      },
      message: 'Your trip to Barcelona has been updated with new dates.',
      createdAt: new Date().toISOString(),
      read: false,
    };

    handleIncomingNotification(notification);
  }, [handleIncomingNotification]);

  return {
    addTripInviteNotification,
    addSystemNotification,
    addChatNotification,
    addTripUpdateNotification,
  };
};
