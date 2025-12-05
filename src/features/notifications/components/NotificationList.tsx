import React, { useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useNotificationStore } from '../store/useNotificationStore';
import { NotificationItem } from './NotificationItem';
import { FlashList } from '@shopify/flash-list';

interface NotificationListProps {
  onItemPress?: (notificationId: string) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({ onItemPress }) => {
  const theme = useAppTheme().theme;
  const {
    notifications,
    unreadCount,
    isFetching: loading,
    error,
    fetchNotifications,
    markAllNotificationsRead: markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    // Fetch notifications when component mounts
    fetchNotifications();
  }, [fetchNotifications]);

  const handleItemPress = (notificationId: string) => {
    if (onItemPress) {
      onItemPress(notificationId);
    }
  };

  const handleRefresh = () => {
    fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={styles.errorText}>
          {error}
        </Text>
        <Button mode="contained" onPress={handleRefresh} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={styles.emptyText}>
          No notifications yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.header}>
          <Text variant="bodyMedium">
            You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
          </Text>
          <Button mode="text" onPress={handleMarkAllAsRead} compact>
            Mark all as read
          </Button>
        </View>
      )}

      <FlashList
        data={notifications}
        renderItem={({ item }) => (
          <NotificationItem notification={item} onPress={() => handleItemPress(item.id)} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        // @ts-ignore - estimatedItemSize exists in FlashList but types may be outdated
        estimatedItemSize={120}
        onRefresh={handleRefresh}
        refreshing={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    opacity: 0.7,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
});
