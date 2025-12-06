import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTrip } from '@/src/features/trips/hooks';
import TripDetailScreen from '@/src/features/trips/screens/TripDetailScreen';
import LoadingScreen from '@/src/components/common/LoadingScreen';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export default function TripDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, isLoading, error, refetch } = useTrip(id ?? '');

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !trip) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#666" style={styles.errorIcon} />
        <ThemedText variant="body.large" style={styles.errorText}>
          {error ? 'Failed to load trip' : 'Trip not found'}
        </ThemedText>
        <ThemedText variant="body.medium" style={styles.errorSubtext}>
          {error ? 'Please check your connection and try again' : 'This trip may have been deleted'}
        </ThemedText>
        <Button mode="contained" onPress={() => refetch()} style={styles.retryButton}>
          Try Again
        </Button>
        <Button mode="outlined" onPress={() => router.back()} style={styles.backButton}>
          Go Back
        </Button>
      </ThemedView>
    );
  }

  return <TripDetailScreen trip={trip} />;
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  retryButton: {
    marginBottom: 12,
    minWidth: 150,
  },
  backButton: {
    minWidth: 150,
  },
});
