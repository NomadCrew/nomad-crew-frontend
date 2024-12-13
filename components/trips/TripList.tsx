import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, Pressable, RefreshControl, Platform } from 'react-native';
import { format } from 'date-fns';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTripStore } from '@/src/store/useTripStore';
import { useTheme } from '@/src/theme/ThemeProvider';

import CreateTripModal from './CreateTripModal';
import { Trip } from './CreateTripModal';

export default function TripList() {
  const { trips, loading, error, fetchTrips, createTrip } = useTripStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { theme } = useTheme();

  useEffect(() => {
    fetchTrips().catch(console.error);
  }, []);

  const handleCreateTrip = async (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createTrip(trip);
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to create trip:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTrips();
    } finally {
      setRefreshing(false);
    }
  };

  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </ThemedText>
        <Pressable 
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} 
          onPress={fetchTrips}
        >
          <ThemedText style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Retry
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {trips.length === 0 && !loading ? (
        <ThemedView style={styles.emptyState}>
          <IconSymbol 
            name="plus.circle.fill" 
            size={48} 
            color={theme.colors.primary} 
          />
          <ThemedText style={[styles.emptyText, { color: theme.colors.primary }]}>
            No trips yet
          </ThemedText>
          <Pressable 
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <ThemedText style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
              Create Your First Trip
            </ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable 
              style={[styles.tripCard, { 
                backgroundColor: theme.colors.surface,
              }]}
            >
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              <ThemedText>{item.destination}</ThemedText>
              <ThemedText>{format(item.startDate, 'MMM dd, yyyy')}</ThemedText>
            </Pressable>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
      
      <CreateTripModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateTrip}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    fontWeight: '600',
  },
  tripCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});