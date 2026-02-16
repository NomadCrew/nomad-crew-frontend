import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, View } from 'react-native';
import { useNotificationStore } from '../store/useNotificationStore';
import { NotificationToast } from './NotificationToast';
import { Notification } from '../types/notification';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [queue, setQueue] = useState<Notification[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Subscribe to notification store changes for toast display
  useEffect(() => {
    // Snapshot current notification IDs as "already seen"
    const currentNotifications = useNotificationStore.getState().notifications;
    for (const n of currentNotifications) {
      seenIdsRef.current.add(n.id);
    }

    const unsubscribe = useNotificationStore.subscribe((state) => {
      const notifications = state.notifications;

      // Find new notifications we haven't seen yet
      const newNotifications = notifications.filter(
        (n) => !seenIdsRef.current.has(n.id) && !n.read
      );

      // Mark all current IDs as seen
      for (const n of notifications) {
        seenIdsRef.current.add(n.id);
      }

      if (newNotifications.length > 0) {
        const firstNotif = newNotifications[0];
        if (firstNotif) {
          setActiveToast((current) => {
            if (current) {
              // Already showing a toast, queue the new ones
              setQueue((prev) => [...prev, ...newNotifications]);
              return current;
            }
            // Show first notification, queue the rest
            if (newNotifications.length > 1) {
              setQueue((prev) => [...prev, ...newNotifications.slice(1)]);
            }
            return firstNotif;
          });
        }
      }
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // B4: Refresh unread count when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground — refresh unread count
        useNotificationStore.getState().fetchUnreadCount();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Process queue when active toast is dismissed
  useEffect(() => {
    if (!activeToast && queue.length > 0) {
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
