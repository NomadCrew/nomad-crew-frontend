import React, { useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useNotificationStore } from '../store/useNotificationStore';
import {
  Notification,
  TripInvitationNotification,
  isTripInvitationNotification,
} from '../types/notification';
import { SwipeableNotificationItem } from './SwipeableNotificationItem';
import { InvitationCard } from './InvitationCard';
import { ActivityItem } from './ActivityItem';
import { EmptyNotificationState, EmptyStateType } from './EmptyNotificationState';

export type NotificationFilter = 'invitations' | 'activity' | 'all';

interface NotificationListProps {
  filter?: NotificationFilter;
  onItemPress?: (notificationId: string) => void;
}

/**
 * Notification list component with filtering support.
 * Renders different item components based on notification type:
 * - Invitations use InvitationCard
 * - Other types use ActivityItem
 * All items are wrapped in SwipeableNotificationItem for swipe actions.
 */
export const NotificationList: React.FC<NotificationListProps> = ({
  filter = 'all',
  onItemPress,
}) => {
  const { theme } = useAppTheme();
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

  // Filter notifications based on the filter prop
  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'invitations':
        return notifications.filter(isTripInvitationNotification);
      case 'activity':
        return notifications.filter((n) => !isTripInvitationNotification(n));
      case 'all':
      default:
        return notifications;
    }
  }, [notifications, filter]);

  // Calculate unread count for filtered list
  const filteredUnreadCount = useMemo(() => {
    return filteredNotifications.filter((n) => !n.read).length;
  }, [filteredNotifications]);

  const handleItemPress = useCallback(
    (notificationId: string) => {
      onItemPress?.(notificationId);
    },
    [onItemPress]
  );

  const handleRefresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  // Render individual notification item
  const renderItem = useCallback(
    ({ item }: { item: Notification }) => {
      const content = isTripInvitationNotification(item) ? (
        <InvitationCard invitation={item as TripInvitationNotification} />
      ) : (
        <ActivityItem notification={item} onPress={() => handleItemPress(item.id)} />
      );

      return <SwipeableNotificationItem notification={item}>{content}</SwipeableNotificationItem>;
    },
    [handleItemPress]
  );

  // Get empty state type based on filter
  const emptyStateType: EmptyStateType = filter === 'all' ? 'all' : filter;

  // Loading state
  if (loading && filteredNotifications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  // Error state
  if (error && filteredNotifications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text
          variant="bodyLarge"
          style={{
            color: theme.colors.status.error.content,
            marginBottom: 16,
            textAlign: 'center' as const,
          }}
        >
          {error}
        </Text>
        <Button mode="contained" onPress={handleRefresh} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  // Empty state - wrap in ScrollView with RefreshControl for pull-to-refresh
  if (filteredNotifications.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.emptyScrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
      >
        <EmptyNotificationState type={emptyStateType} />
      </ScrollView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Unread count header - only show for 'all' filter */}
      {filter === 'all' && filteredUnreadCount > 0 && (
        <View style={styles.header}>
          <Text variant="bodyMedium">
            You have {filteredUnreadCount} unread{' '}
            {filteredUnreadCount === 1 ? 'notification' : 'notifications'}
          </Text>
          <Button mode="text" onPress={handleMarkAllAsRead} compact>
            Mark all as read
          </Button>
        </View>
      )}

      <FlashList
        data={filteredNotifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        estimatedItemSize={filter === 'invitations' ? 160 : 100}
        onRefresh={handleRefresh}
        refreshing={loading}
      />
    </GestureHandlerRootView>
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
  emptyScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
});
