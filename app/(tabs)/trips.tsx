import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TripList } from '@/src/features/trips/components/TripList';
import { useTripStore } from '@/src/features/trips/store';
import { router } from 'expo-router';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';
import { Trip, CreateTripInput } from '@/src/features/trips/types';
import { FAB } from 'react-native-paper';
import CreateTripModal from '@/src/features/trips/components/CreateTripModal';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const { trips, fetchTrips, createTrip } = useTripStore();
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useAppTheme();

  const handleTripPress = (trip: Trip) => {
    router.push(`/trip/${trip.id}`);
  };

  const handleOpenModal = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  const handleSubmit = async (tripData: Trip) => {
    // Map Trip to CreateTripInput
    const input: CreateTripInput = {
      name: tripData.name || '',
      description: tripData.description,
      destination: {
        address: tripData.destination?.address || '',
        placeId: tripData.destination?.placeId || '',
        coordinates: tripData.destination?.coordinates,
      },
      startDate: new Date(tripData.startDate),
      endDate: new Date(tripData.endDate),
    };
    await createTrip(input);
    await fetchTrips(); // Refresh trips after creation
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}> 
      <ThemedView style={styles.header}>
        <ThemedText variant="display.medium">My Trips</ThemedText>
      </ThemedView>
      <TripList onTripPress={handleTripPress} />
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 24, backgroundColor: theme.colors.primary.main }]}
        color={theme.colors.primary.onPrimary}
        onPress={handleOpenModal}
        accessibilityLabel="Create a new trip"
      />
      <CreateTripModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />
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
  fab: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
  },
}); 