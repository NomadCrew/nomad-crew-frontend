import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

/**
 * Render a "not found" screen with a message and a link to the home screen.
 *
 * @returns The React element for a "not found" screen containing a heading and a link to the home route (`/`).
 */
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <ThemedText variant="heading.h1">This screen doesn't exist.</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText variant="body.medium" color="primary.main">
            Go to home screen!
          </ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});