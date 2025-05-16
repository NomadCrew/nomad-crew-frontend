import { useNotificationStore } from '../store/useNotificationStore';
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useTestNotifications = () => {
  const { addNotification } = useNotificationStore();
  
  const addTripInviteNotification = useCallback(() => {
    const inviteId = uuidv4();
    const tripId = uuidv4();
    
    addNotification({
      id: inviteId,
      type: 'TRIP_INVITE',
      inviteId,
      tripId,
      inviterName: 'Test User',
      message: 'You have been invited to join a trip!',
      timestamp: new Date().toISOString(),
      status: 'pending',
      isRead: false
    });
  }, [addNotification]);
  
  const addSystemNotification = useCallback(() => {
    addNotification({
      id: uuidv4(),
      type: 'SYSTEM',
      title: 'System Notification',
      message: 'This is a test system notification.',
      timestamp: new Date().toISOString(),
      isRead: false
    });
  }, [addNotification]);
  
  const addChatNotification = useCallback(() => {
    addNotification({
      id: uuidv4(),
      type: 'CHAT_MESSAGE',
      title: 'New Message',
      message: 'You have a new message from Test User.',
      timestamp: new Date().toISOString(),
      isRead: false,
      data: {
        userId: uuidv4(),
        tripId: uuidv4(),
        userName: 'Test User'
      }
    });
  }, [addNotification]);
  
  const addTripUpdateNotification = useCallback(() => {
    addNotification({
      id: uuidv4(),
      type: 'TRIP_UPDATE',
      title: 'Trip Updated',
      message: 'Your trip to Barcelona has been updated with new dates.',
      timestamp: new Date().toISOString(),
      isRead: false,
      data: {
        tripId: uuidv4(),
        updatedBy: 'Trip Owner'
      }
    });
  }, [addNotification]);
  
  return {
    addTripInviteNotification,
    addSystemNotification,
    addChatNotification,
    addTripUpdateNotification
  };
}; 