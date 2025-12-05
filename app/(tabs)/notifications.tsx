import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';
import { NotificationList } from '@/src/features/notifications/components/NotificationList';
import { NotificationTestButton } from '@/src/features/notifications/components/NotificationTestButton';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedView style={styles.header}>
        <ThemedText variant="display.medium">Notifications</ThemedText>
      </ThemedView>
      
      <NotificationList />
      
      <ThemedView style={styles.testSection}>
        <ThemedText variant="body.small" style={styles.testSectionTitle}>
          Test Controls
        </ThemedText>
        <NotificationTestButton />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  testSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  testSectionTitle: {
    marginBottom: 8,
    opacity: 0.7,
  }
}); 