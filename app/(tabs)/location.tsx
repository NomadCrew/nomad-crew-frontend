import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedView style={styles.header}>
        <ThemedText variant="display.medium">Location</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.content}>
        <ThemedText variant="body.large">
          Location sharing feature
        </ThemedText>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
}); 