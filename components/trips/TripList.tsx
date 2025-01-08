// components/trips/TripList.tsx
import React from 'react';
import { StyleSheet, RefreshControl, ActivityIndicator, ViewStyle } from 'react-native';
import { format } from 'date-fns';
import { useTheme } from '@/src/theme/ThemeProvider';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { TripCard } from './TripCard';
import { useTripStore } from '@/src/store/useTripStore';
import { Trip, TripStatus } from '@/src/types/trip';

interface TripSection {
  title: string;
  data: Trip[];
}

interface Props {
  onTripPress?: (trip: Trip) => void;
  style?: ViewStyle;
}

export function TripList({ onTripPress, style }: Props) {
  const { theme } = useTheme();
  const { trips, loading, fetchTrips } = useTripStore();
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    fetchTrips().catch(console.error);
  }, [fetchTrips]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTrips();
    } finally {
      setRefreshing(false);
    }
  }, [fetchTrips]);

  const sections = React.useMemo(() => {
    const now = new Date();
    
    const activeTrips = trips.filter(trip => 
      trip.status === 'ACTIVE'
    );
    
    const upcomingTrips = trips.filter(trip => 
      trip.status === 'PLANNING' && new Date(trip.startDate) > now
    );
    
    const pastTrips = trips.filter(trip => 
      trip.status === 'COMPLETED' || new Date(trip.endDate) < now
    );

    return [
      { title: 'Active Trips', data: activeTrips },
      { title: 'Upcoming Trips', data: upcomingTrips },
      { title: 'Past Trips', data: pastTrips },
    ].filter(section => section.data.length > 0);
  }, [trips]);

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, style]}>
      {sections.map((section, index) => (
        <ThemedView key={section.title} style={index > 0 ? styles.section : undefined}>
          <ThemedText 
            variant="heading.h2" 
            color="content.primary"
            style={styles.sectionTitle}
          >
            {section.title}
          </ThemedText>
          {section.data.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onPress={() => onTripPress?.(trip)}
              style={styles.card}
            />
          ))}
        </ThemedView>
      ))}
      
      {trips.length === 0 && !loading && (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText
            variant="body.large"
            color="content.secondary"
            style={styles.emptyText}
          >
            No trips found. Create your first trip to get started!
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
  },
});