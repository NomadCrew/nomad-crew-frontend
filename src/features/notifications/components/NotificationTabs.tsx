import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SegmentedButtons, Badge } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { useNotificationStore, selectTripInvitations } from '../store/useNotificationStore';
import { isTripInvitationNotification } from '../types/notification';

export type NotificationTabValue = 'invitations' | 'activity';

interface NotificationTabsProps {
  activeTab: NotificationTabValue;
  onTabChange: (tab: NotificationTabValue) => void;
}

/**
 * Tab switcher for notifications screen.
 * Uses React Native Paper's SegmentedButtons with unread badges.
 */
export const NotificationTabs: React.FC<NotificationTabsProps> = ({ activeTab, onTabChange }) => {
  const { theme } = useAppTheme();
  const { notifications } = useNotificationStore();

  // Calculate unread counts for each tab
  const invitations = notifications.filter(isTripInvitationNotification);
  const activities = notifications.filter((n) => !isTripInvitationNotification(n));

  const unreadInvitations = invitations.filter((n) => !n.read).length;
  const unreadActivities = activities.filter((n) => !n.read).length;

  const themedStyles = styles(theme);

  return (
    <View style={themedStyles.container}>
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => onTabChange(value as NotificationTabValue)}
        buttons={[
          {
            value: 'invitations',
            label: 'Invitations',
            icon: 'account-plus',
            showSelectedCheck: false,
          },
          {
            value: 'activity',
            label: 'Activity',
            icon: 'bell-outline',
            showSelectedCheck: false,
          },
        ]}
        style={themedStyles.segmentedButtons}
      />

      {/* Badge overlays */}
      {unreadInvitations > 0 && (
        <View style={[themedStyles.badgeContainer, themedStyles.badgeLeft]}>
          <Badge size={18} style={themedStyles.badge}>
            {unreadInvitations > 9 ? '9+' : unreadInvitations}
          </Badge>
        </View>
      )}
      {unreadActivities > 0 && (
        <View style={[themedStyles.badgeContainer, themedStyles.badgeRight]}>
          <Badge size={18} style={themedStyles.badge}>
            {unreadActivities > 9 ? '9+' : unreadActivities}
          </Badge>
        </View>
      )}
    </View>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.inset.md,
      paddingVertical: theme.spacing.inset.sm,
      position: 'relative',
    },
    segmentedButtons: {
      backgroundColor: theme.colors.surface.variant,
    },
    badgeContainer: {
      position: 'absolute',
      top: 4,
    },
    badgeLeft: {
      left: '25%',
      marginLeft: 20,
    },
    badgeRight: {
      right: '25%',
      marginRight: -20,
    },
    badge: {
      backgroundColor: theme.colors.primary.main,
    },
  });
