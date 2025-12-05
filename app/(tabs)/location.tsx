import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';

// BareMap debug component renders a plain MapView for quick validation
// Only imported in development to avoid bundling overhead in production
let BareMap: React.ComponentType | null = null;
if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  BareMap = require('../debug/BareMap').default;
}

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedView style={styles.header}>
        <ThemedText variant="display.medium">Location</ThemedText>
      </ThemedView>
      
      {__DEV__ && BareMap ? (
        <BareMap />
      ) : (
        <ThemedView style={styles.content}>
          <ThemedText variant="body.large">
            Location sharing feature
          </ThemedText>
        </ThemedView>
      )}
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