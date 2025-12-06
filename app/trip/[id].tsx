import { useLocalSearchParams } from 'expo-router';
import { useTrip } from '@/src/features/trips/hooks';
import TripDetailScreen from '@/src/features/trips/screens/TripDetailScreen';
import LoadingScreen from '@/src/components/common/LoadingScreen';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';

export default function TripDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading, error } = useTrip(id ?? '');

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !trip) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText variant="body.large">
          {error ? 'Failed to load trip' : 'Trip not found'}
        </ThemedText>
      </ThemedView>
    );
  }

  return <TripDetailScreen trip={trip} />;
}
