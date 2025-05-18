import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TripList } from '@/src/features/trips/components/TripList';
import { useTripStore } from '@/src/features/trips/store';
import { router } from 'expo-router';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';
import { Trip } from '@/src/features/trips/types';

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const { trips } = useTripStore();
  
  const handleTripPress = (trip: Trip) => {
    router.push(`/trip/${trip.id}`);
  };
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedView style={styles.header}>
        <ThemedText variant="display.medium">My Trips</ThemedText>
      </ThemedView>
      
      <TripList onTripPress={handleTripPress} />
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
}); 