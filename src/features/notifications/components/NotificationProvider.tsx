import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNotificationStore } from '../store/useNotificationStore';
import { NotificationToast } from './NotificationToast';
import { Notification } from '../types/notification';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [queue, setQueue] = useState<Notification[]>([]);
  const notificationStore = useNotificationStore();

  // Type guard to ensure notification is valid
  const isValidNotification = (notif: Notification): notif is Notification => {
    return notif && notif.id && notif.type ? true : false;
  };

  // Subscribe to notification store changes
  useEffect(() => {
    // Get initial notifications
    const initialNotifications = notificationStore.notifications;

    // Setup subscription for new notifications
    const unsubscribe = useNotificationStore.subscribe((state) => {
      const notifications = state.notifications;

      // Only proceed if we have more notifications than before
      if (notifications.length > initialNotifications.length) {
        // Find new notifications (ones that don't exist in our initial set)
        const newNotifications = notifications.filter(
          (n) => !initialNotifications.some((initial) => initial.id === n.id) && !n.read
        );

        // If we have new notifications, show them
        if (newNotifications.length > 0) {
          // Add to queue if there's already an active toast, otherwise show directly
          const firstNotif = newNotifications[0];
          if (activeToast) {
            setQueue((prev) => [...prev, ...newNotifications]);
          } else if (firstNotif) {
            setActiveToast(firstNotif);

            // If there are more, add them to the queue
            if (newNotifications.length > 1) {
              setQueue((prev) => [...prev, ...newNotifications.slice(1)]);
            }
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Process queue when active toast is dismissed
  useEffect(() => {
    if (!activeToast && queue.length > 0) {
      // Show the next notification in queue
      const nextNotif = queue[0];
      if (nextNotif) {
        setActiveToast(nextNotif);
      }
      setQueue((prev) => prev.slice(1));
    }
  }, [activeToast, queue]);

  // Handle toast dismissal
  const handleDismiss = () => {
    setActiveToast(null);
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      {activeToast && <NotificationToast notification={activeToast} onDismiss={handleDismiss} />}
    </View>
  );
};
