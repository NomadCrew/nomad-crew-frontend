import React, { useState } from 'react';
import { View, ViewStyle, TextStyle } from 'react-native';
import { Text, IconButton, Dialog, Portal, Button } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { useNotificationStore } from '../store/useNotificationStore';

interface NotificationHeaderProps {
  title?: string;
  showActions?: boolean;
}

// Error color fallback - status.error.content gives us a proper string color
const getErrorColor = (theme: Theme): string => {
  return theme.colors.status.error.content;
};

/**
 * Header component for notifications screen.
 * Features:
 * - Title
 * - Mark All Read button (eye-check icon) - marks all as read, keeps in list
 * - Clear All button (trash icon) - permanently deletes with confirmation
 */
export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  title = 'Notifications',
  showActions = true,
}) => {
  const { theme } = useAppTheme();
  const {
    notifications,
    unreadCount,
    clearNotifications,
    markAllNotificationsRead,
    isHandlingAction,
    isMarkingRead,
  } = useNotificationStore();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const hasNotifications = notifications.length > 0;
  const hasUnread = unreadCount > 0;
  const errorColor = getErrorColor(theme);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
  };

  const handleClearAll = () => {
    setShowConfirmDialog(true);
  };

  const confirmClearAll = async () => {
    setShowConfirmDialog(false);
    await clearNotifications();
  };

  const themedStyles = styles(theme);

  return (
    <>
      <View style={themedStyles.container}>
        <Text variant="headlineMedium" style={themedStyles.title}>
          {title}
        </Text>

        {showActions && (
          <View style={themedStyles.actionsContainer}>
            {/* Mark All Read - only shown when there are unread notifications */}
            {hasUnread && (
              <IconButton
                icon="eye-check"
                iconColor={theme.colors.content.secondary}
                size={22}
                onPress={handleMarkAllRead}
                disabled={isMarkingRead || isHandlingAction}
                accessibilityLabel="Mark all notifications as read"
              />
            )}

            {/* Clear All - only shown when there are notifications */}
            {hasNotifications && (
              <IconButton
                icon="trash-can-outline"
                iconColor={theme.colors.status.error.content}
                size={22}
                onPress={handleClearAll}
                disabled={isHandlingAction}
                accessibilityLabel="Clear all notifications"
              />
            )}
          </View>
        )}
      </View>

      {/* Confirmation Dialog for Clear All */}
      <Portal>
        <Dialog visible={showConfirmDialog} onDismiss={() => setShowConfirmDialog(false)}>
          <Dialog.Title>Clear All Notifications</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete all notifications? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button onPress={confirmClearAll} textColor={errorColor}>
              Delete All
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

interface NotificationHeaderStyles {
  container: ViewStyle;
  title: TextStyle;
  actionsContainer: ViewStyle;
}

const styles = (theme: Theme): NotificationHeaderStyles => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.inset.md,
    paddingVertical: theme.spacing.inset.sm,
  },
  title: {
    color: theme.colors.content.primary,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
