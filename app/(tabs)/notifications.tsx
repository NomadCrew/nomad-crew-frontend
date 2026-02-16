import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/src/components/ThemedView';
import { NotificationList } from '@/src/features/notifications/components/NotificationList';
import { NotificationHeader } from '@/src/features/notifications/components/NotificationHeader';
import {
  NotificationTabs,
  NotificationTabValue,
} from '@/src/features/notifications/components/NotificationTabs';

/**
 * Renders the Notifications screen with a header, tabbed filters, and a filtered notification list.
 *
 * Displays a header (including a Clear All action), a tab switcher that selects the active notification
 * filter, and a NotificationList filtered by the selected tab.
 *
 * @returns The notifications screen element.
 */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<NotificationTabValue>('invitations');

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Clear All button */}
      <NotificationHeader />

      {/* Tab switcher */}
      <NotificationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Notification list filtered by active tab */}
      <NotificationList filter={activeTab} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
