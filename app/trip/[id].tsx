import { useLocalSearchParams } from 'expo-router';
import { useTripStore } from '@/src/features/trips/store';
import TripDetailScreen from '@/src/features/trips/screens/TripDetailScreen';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function TripDetailsRoute() {
  const { id } = useLocalSearchParams();
  const { trips } = useTripStore();
  
  const trip = trips.find(t => t.id === id);
  
  if (!trip) {
    return <LoadingScreen />;
  }

  return <TripDetailScreen trip={trip} />;
}