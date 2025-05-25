import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/src/api/supabase';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { logger } from '@/src/utils/logger';
import { RealtimeChannel } from '@supabase/supabase-js';

export type LocationPrivacyLevel = 'hidden' | 'approximate' | 'precise';

export interface Location {
  id: string;
  trip_id: string;
  user_id: string;
  user_name?: string;
  latitude: number;
  longitude: number;
  privacy_level: LocationPrivacyLevel;
  created_at: string;
  updated_at: string;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  privacyLevel?: LocationPrivacyLevel;
}

export interface UseLocationsParams {
  tripId: string;
  autoConnect?: boolean;
}

export interface UseLocationsReturn {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  connectionStatus: string;
  updateLocation: (request: UpdateLocationRequest) => Promise<void>;
  refreshLocations: () => Promise<void>;
  connect: () => void;
  disconnect: () => void;
  getLocationByUserId: (userId: string) => Location | undefined;
  getVisibleLocations: () => Location[];
}

export function useLocations({ tripId, autoConnect = true }: UseLocationsParams): UseLocationsReturn {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  // Fetch locations from API
  const fetchLocations = useCallback(async () => {
    if (!tripId) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(API_PATHS.location.byTrip(tripId));
      
      if (isMountedRef.current) {
        setLocations(response.data || []);
      }
    } catch (err) {
      logger.error('useLocations', 'Failed to fetch locations:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch locations');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [tripId]);

  // Update location via API
  const updateLocation = useCallback(async (request: UpdateLocationRequest) => {
    if (!tripId) return;

    try {
      await api.put(API_PATHS.location.byTrip(tripId), {
        latitude: request.latitude,
        longitude: request.longitude,
        privacy_level: request.privacyLevel || 'precise'
      });
    } catch (err) {
      logger.error('useLocations', 'Failed to update location:', err);
      throw err;
    }
  }, [tripId]);

  // Refresh locations (alias for fetchLocations)
  const refreshLocations = useCallback(async () => {
    await fetchLocations();
  }, [fetchLocations]);

  // Get location by user ID
  const getLocationByUserId = useCallback((userId: string): Location | undefined => {
    return locations.find(location => location.user_id === userId);
  }, [locations]);

  // Get visible locations (respecting privacy settings)
  const getVisibleLocations = useCallback((): Location[] => {
    return locations.filter(location => {
      // Always show if sharing is disabled
      if (!location.is_sharing_enabled) {
        return false;
      }

      // Filter based on privacy level
      switch (location.privacy_level) {
        case 'hidden':
          return false;
        case 'approximate':
        case 'precise':
          return true;
        default:
          return false;
      }
    });
  }, [locations]);

  // Handle realtime events
  const handleRealtimeEvent = useCallback((payload: any) => {
    if (!isMountedRef.current) return;

    logger.debug('useLocations', 'Received realtime event:', payload);

    const { eventType, new: newRecord, old: oldRecord } = payload;

    setLocations(currentLocations => {
      switch (eventType) {
        case 'INSERT':
          if (newRecord && newRecord.trip_id === tripId) {
            // Check if location already exists to avoid duplicates
            const exists = currentLocations.some(loc => loc.id === newRecord.id);
            if (!exists) {
              return [...currentLocations, newRecord];
            }
          }
          return currentLocations;

        case 'UPDATE':
          if (newRecord && newRecord.trip_id === tripId) {
            return currentLocations.map(loc =>
              loc.id === newRecord.id ? newRecord : loc
            );
          }
          return currentLocations;

        case 'DELETE':
          if (oldRecord) {
            return currentLocations.filter(loc => loc.id !== oldRecord.id);
          }
          return currentLocations;

        default:
          return currentLocations;
      }
    });
  }, [tripId]);

  // Connect to Supabase Realtime
  const connect = useCallback(() => {
    if (!tripId || channelRef.current) return;

    logger.debug('useLocations', 'Connecting to realtime for trip:', tripId);
    
    const channel = supabase
      .channel(`trip-locations-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locations',
          filter: `trip_id=eq.${tripId}`,
        },
        handleRealtimeEvent
      )
      .subscribe((status) => {
        logger.debug('useLocations', 'Subscription status:', status);
        setConnectionStatus(status);
        
        if (status === 'SUBSCRIBED') {
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setError('Failed to connect to realtime locations');
        }
      });

    channelRef.current = channel;
  }, [tripId, handleRealtimeEvent]);

  // Disconnect from Supabase Realtime
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      logger.debug('useLocations', 'Disconnecting from realtime');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setConnectionStatus('disconnected');
    }
  }, []);

  // Setup and cleanup
  useEffect(() => {
    isMountedRef.current = true;

    if (autoConnect) {
      fetchLocations();
      connect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [autoConnect, fetchLocations, connect, disconnect]);

  return {
    locations,
    isLoading,
    error,
    connectionStatus,
    updateLocation,
    refreshLocations,
    connect,
    disconnect,
    getLocationByUserId,
    getVisibleLocations,
  };
} 