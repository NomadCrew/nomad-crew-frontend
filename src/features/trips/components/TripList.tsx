import React, { useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';
import { TripCard } from './TripCard';
import { Trip } from '@/src/features/trips/types';

interface Props {
  onTripPress?: (trip: Trip) => void;
  style?: ViewStyle;
  trips?: Trip[];
}

const GHOST_CARD: Trip = {
  id: 'ghost-spacer',
  name: 'Ghost Spacer',
  description: 'Spacer for layout',
  destination: {
    address: 'Ghost Destination',
    placeId: 'ghost-place-id',
  },
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  status: 'PLANNING',
  createdBy: 'system',
  isGhostCard: true,
  createdAt: '',
  updatedAt: '',
  members: [
    {
      userId: 'system',
      role: 'owner' as const,
      joinedAt: new Date().toISOString(),
    },
  ],
};

export function TripList({ onTripPress, style, trips: propTrips = [] }: Props) {
  const trips = propTrips;

  // Defensive normalization: ensure every trip has a valid members array
  const safeTrips: Trip[] = trips.map((trip) => {
    if (!Array.isArray(trip.members)) {
      console.error('[TripList] Malformed members array:', trip.id, trip.members, trip);
    }
    return {
      ...trip,
      members: Array.isArray(trip.members) ? trip.members : [],
    } as Trip;
  });

  const sections = useMemo(() => {
    const now = new Date();

    const activeTrips = safeTrips.filter((trip) => {
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      return (
        (trip.status === 'PLANNING' || trip.status === 'ACTIVE') &&
        startDate <= now &&
        endDate >= now
      );
    });

    const upcomingTrips = safeTrips.filter((trip) => {
      const startDate = new Date(trip.startDate);
      return (trip.status === 'PLANNING' || trip.status === 'ACTIVE') && startDate > now;
    });

    const pastTrips = safeTrips.filter((trip) => {
      const endDate = new Date(trip.endDate);
      return trip.status === 'COMPLETED' || trip.status === 'CANCELLED' || endDate < now;
    });

    // Create sections first
    let sections = [
      { title: 'Active Trips', data: activeTrips },
      { title: 'Upcoming Trips', data: upcomingTrips },
      { title: 'Past Trips', data: pastTrips },
    ].filter((section) => section.data.length > 0);

    // Add ghost card to the last section if there are any sections
    if (sections.length > 0) {
      const lastSection = sections[sections.length - 1];
      if (lastSection) {
        lastSection.data = [...lastSection.data, GHOST_CARD];
      }
    }

    return sections;
  }, [safeTrips]);

  return (
    <ThemedView style={[styles.container, style]}>
      {sections.map((section, index) => (
        <ThemedView key={section.title} style={index > 0 ? styles.section : undefined}>
          {section.data.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onPress={() => !trip.isGhostCard && onTripPress?.(trip)}
              style={[styles.card, trip.isGhostCard && styles.ghostCard]}
            />
          ))}
        </ThemedView>
      ))}

      {trips.length === 0 && (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText variant="body.large" color="content.secondary" style={styles.emptyText}>
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
  section: {
    marginTop: 24,
    flexGrow: 1,
  },
  sectionTitle: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    flex: 1,
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
  ghostCard: {
    backgroundColor: 'transparent',
    elevation: 0,
    height: 120,
    shadowOpacity: 0,
    borderWidth: 0,
  },
});
