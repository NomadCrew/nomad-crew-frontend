import { useLocalSearchParams } from 'expo-router';
import { useTripStore } from '@/src/features/trips/store';
import { View, StyleSheet, Text, Pressable, InteractionManager } from 'react-native';
import { GroupLiveMap } from '../components/GroupLiveMap';
import { useRouter } from 'expo-router';
import { LoadingScreen } from '@/src/features/common/components/LoadingScreen';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { logger } from '@/src/utils/logger';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { Trip } from '@/src/features/trips/types';
import { Theme } from '@/src/theme/types';

// Supabase Realtime imports
import { useLocations } from '@/src/features/trips/hooks/useLocations';

export default function LocationScreen() {
  const { id } = useLocalSearchParams();
  const { trips, fetchTrips } = useTripStore();
  const router = useRouter();
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [tripData, setTripData] = useState<Trip | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Delay map rendering until navigation is complete to prevent Fabric viewState errors
  // See: https://github.com/facebook/react-native/issues/49077
  const [isReadyToRenderMap, setIsReadyToRenderMap] = useState(false);

  // Supabase Realtime hooks
  const locations = useLocations({
    tripId: id as string,
    autoConnect: !!tripData
  });

  // Wait for navigation transition to complete before rendering MapView
  // This prevents "Unable to find viewState" errors with New Architecture (Fabric)
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      // Wait for animations/transitions to complete
      const task = InteractionManager.runAfterInteractions(() => {
        if (isMounted) {
          logger.debug('[LocationScreen] Navigation complete, ready to render map');
          setIsReadyToRenderMap(true);
        }
      });

      return () => {
        isMounted = false;
        task.cancel();
        setIsReadyToRenderMap(false);
      };
    }, [])
  );
  
  useEffect(() => {
    const loadTripData = async () => {
      try {
        logger.debug(`[LocationScreen] Loading trip data for ID: ${id}`);
        
        // First check if the trip is already in the store
        const existingTrip = trips.find(t => t.id === id);
        if (existingTrip) {
          logger.debug(`[LocationScreen] Found trip in store: ${existingTrip.name}`);
          setTripData(existingTrip);
          setLoading(false);
          return;
        }
        
        // If not in store, try to fetch all trips
        logger.debug(`[LocationScreen] Trip not found in store, fetching trips`);
        await fetchTrips();
        
        // Check again after fetching
        const fetchedTrip = useTripStore.getState().trips.find(t => t.id === id);
        if (fetchedTrip) {
          logger.debug(`[LocationScreen] Found trip after fetching: ${fetchedTrip.name}`);
          setTripData(fetchedTrip);
          setLoading(false);
          return;
        }
        
        // If still not found, try to fetch this specific trip
        logger.debug(`[LocationScreen] Trip still not found, fetching specific trip`);
        const response = await api.get<Trip>(API_PATHS.trips.byId(id as string));
        if (response.data) {
          logger.debug(`[LocationScreen] Successfully fetched specific trip: ${response.data.name}`);
          setTripData(response.data);
        } else {
          logger.error(`[LocationScreen] Trip not found with ID: ${id}`);
          setError('Trip not found');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load trip data';
        logger.error(`[LocationScreen] Error loading trip: ${errorMessage}`);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    loadTripData();
  }, [id, trips, fetchTrips]);
  
  // Show loading screen while data loads OR while waiting for navigation to complete
  // The isReadyToRenderMap check prevents Fabric viewState race conditions
  if (loading || !isReadyToRenderMap) {
    return <LoadingScreen />;
  }

  if (error || !tripData) {
    return (
      <View style={styles(theme).errorContainer}>
        <StatusBar style="light" />
        <Text style={styles(theme).errorText}>
          {error || 'Trip not found'}
        </Text>
        <Pressable
          style={styles(theme).backButton}
          onPress={() => router.back()}
        >
          <Text style={styles(theme).backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles(theme).container}>
      <StatusBar style="light" />
      <GroupLiveMap
        trip={tripData}
        onClose={() => router.back()}
        isStandalone={true}
        supabaseLocations={locations}
      />
    </View>
  );
}

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background.default,
  },
  errorText: {
    fontSize: theme.typography.size.lg,
    color: theme.colors.content.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: theme.colors.primary.main,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.primary.text,
    fontSize: theme.typography.size.md,
    fontWeight: 'bold',
  },
}); 