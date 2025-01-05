import React, { useMemo, useState } from 'react';
import { 
  StyleSheet, 
  SectionList, 
  RefreshControl,
  ActivityIndicator,
  ViewStyle,
  SectionListRenderItem 
} from 'react-native';
import { format, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { TripCard } from './TripCard';
import { Trip } from '@/src/types/trip';
import { useTheme } from '@/src/theme/ThemeProvider';

interface TripSection {
  title: string;
  data: Trip[];
}

interface TripListProps {
  trips: Trip[];
  loading?: boolean;
  onRefresh?: () => Promise<void>;
  onTripPress?: (trip: Trip) => void;
  style?: ViewStyle;
}

export const TripList: React.FC<TripListProps> = ({
  trips,
  loading = false,
  onRefresh,
  onTripPress,
  style,
}) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const sections = useMemo(() => {
    const now = new Date();
    
    const upcoming = trips.filter(trip => 
      isAfter(new Date(trip.startDate), now) && 
      trip.status !== 'CANCELLED'
    );
    
    const active = trips.filter(trip => 
      isWithinInterval(now, {
        start: new Date(trip.startDate),
        end: new Date(trip.endDate)
      }) && 
      trip.status === 'ACTIVE'
    );
    
    const past = trips.filter(trip => 
      isBefore(new Date(trip.endDate), now) || 
      trip.status === 'COMPLETED'
    );
    
    const cancelled = trips.filter(trip => 
      trip.status === 'CANCELLED'
    );

    return [
      { title: 'Active Trips', data: active },
      { title: 'Upcoming Trips', data: upcoming },
      { title: 'Past Trips', data: past },
      { title: 'Cancelled', data: cancelled },
    ].filter(section => section.data.length > 0);
  }, [trips]);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const renderSectionHeader = ({ section: { title, data } }: { 
    section: TripSection 
  }) => (
    <ThemedView style={styles.sectionHeader}>
      <ThemedText 
        variant="heading.large"
        color="content.primary"
      >
        {title}
      </ThemedText>
      <ThemedText
        variant="body.small"
        color="content.secondary"
      >
        {data.length} {data.length === 1 ? 'trip' : 'trips'}
      </ThemedText>
    </ThemedView>
  );

  const renderItem: SectionListRenderItem<Trip> = ({ item, index }) => (
    <TripCard
      trip={item}
      onPress={() => onTripPress?.(item)}
      style={index > 0 ? styles.cardSpacing : undefined}
    />
  );

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </ThemedView>
    );
  }

  return (
    <SectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={[styles.listContent, style]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.main}
          />
        ) : undefined
      }
      ListEmptyComponent={
        <ThemedView style={styles.emptyContainer}>
          <ThemedText
            variant="body.large"
            color="content.secondary"
            style={styles.emptyText}
          >
            No trips found
          </ThemedText>
        </ThemedView>
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 24,
  },
  cardSpacing: {
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: 'center',
  },
});