import { useLocalSearchParams } from 'expo-router';
import { useTripStore } from '@/src/store/useTripStore';
import TripDetailScreen from '@/screens/trips/TripDetailScreen';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useEffect } from 'react';

export default function TripDetailsRoute() {
  const { id } = useLocalSearchParams();
  const { trips } = useTripStore();
  
  const trip = trips.find(t => t.id === id);
  
  useEffect(() => {
    console.log('TripDetailsRoute - Trip ID:', id);
    console.log('TripDetailsRoute - All trips:', trips);
    console.log('TripDetailsRoute - Found trip:', trip);
    if (trip) {
      console.log('TripDetailsRoute - Trip members:', trip.members);
    }
  }, [id, trips, trip]);
  
  if (!trip) {
    return <LoadingScreen />;
  }

  return <TripDetailScreen trip={trip} />;
}