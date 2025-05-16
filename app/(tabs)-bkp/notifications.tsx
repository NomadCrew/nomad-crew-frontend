import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NotificationList, NotificationTestButton } from '@/src/components/notifications';
import { useTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';

export default function NotificationsTabScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <NotificationList />
      
      <View style={styles.testSection}>
        <Text variant="labelMedium" style={styles.testSectionTitle}>Test Controls</Text>
        <NotificationTestButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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