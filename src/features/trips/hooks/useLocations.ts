import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/src/features/auth/service';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { logger } from '@/src/utils/logger';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { MemberLocation } from '@/src/features/location/types';

export type LocationPrivacyLevel = 'hidden' | 'approximate' | 'precise';

export interface Location {
  id: string;
  trip_id: string;
  user_id: string;
  user_name?: string;
  latitude: number;
  longitude: number;
  privacy_level: LocationPrivacyLevel;
  is_sharing_enabled?: boolean;
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
  /** Raw Supabase row data — use for database operations */
  locations: Location[];
  /** Domain-typed locations for UI consumption */
  memberLocations: MemberLocation[];
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

/** Normalizes a raw Supabase row to the Location interface.
 *  The Supabase table uses `privacy` and `timestamp` as column names,
 *  while the frontend interface uses `privacy_level` and `updated_at`. */
function normalizeSupabaseRow(raw: any): Location {
  return {
    id: raw.id ?? `${raw.user_id}_${raw.trip_id}`,
    trip_id: raw.trip_id,
    user_id: raw.user_id,
    user_name: raw.user_name,
    latitude: raw.latitude,
    longitude: raw.longitude,
    privacy_level: raw.privacy_level ?? raw.privacy ?? 'precise',
    is_sharing_enabled: raw.is_sharing_enabled,
    created_at: raw.created_at ?? raw.timestamp ?? new Date().toISOString(),
    updated_at: raw.updated_at ?? raw.timestamp ?? new Date().toISOString(),
  };
}

/** Maps a Location to the MemberLocation domain type */
function mapToMemberLocation(row: Location): MemberLocation {
  return {
    userId: row.user_id,
    name: row.user_name,
    location: {
      latitude: row.latitude,
      longitude: row.longitude,
      timestamp: new Date(row.updated_at).getTime(),
    },
  };
}

export function useLocations({
  tripId,
  autoConnect = true,
}: UseLocationsParams): UseLocationsReturn {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  // Fetch locations from the backend API.
  // The backend queries Supabase with the service key (bypasses RLS) and
  // returns the data. Realtime subscription handles live updates after this.
  const fetchLocations = useCallback(async () => {
    if (!tripId) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(API_PATHS.location.byTrip(tripId));

      if (isMountedRef.current) {
        const locationsData = response.data?.locations || response.data || [];
        const rows = Array.isArray(locationsData) ? locationsData : [];
        // Deduplicate by user_id, keeping the latest entry per user
        const normalized = rows.map(normalizeSupabaseRow);
        const latestByUser = new Map<string, Location>();
        for (const loc of normalized) {
          const existing = latestByUser.get(loc.user_id);
          if (!existing || loc.updated_at > existing.updated_at) {
            latestByUser.set(loc.user_id, loc);
          }
        }
        setLocations(Array.from(latestByUser.values()));
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
  const updateLocation = useCallback(
    async (request: UpdateLocationRequest) => {
      if (!tripId) return;

      try {
        await api.put(API_PATHS.location.byTrip(tripId), {
          latitude: request.latitude,
          longitude: request.longitude,
          privacy_level: request.privacyLevel || 'precise',
        });
      } catch (err) {
        logger.error('useLocations', 'Failed to update location:', err);
        throw err;
      }
    },
    [tripId]
  );

  // Refresh locations (alias for fetchLocations)
  const refreshLocations = useCallback(async () => {
    await fetchLocations();
  }, [fetchLocations]);

  // Get location by user ID
  const getLocationByUserId = useCallback(
    (userId: string): Location | undefined => {
      return locations.find((location) => location.user_id === userId);
    },
    [locations]
  );

  // Get visible locations (respecting privacy settings)
  const getVisibleLocations = useCallback((): Location[] => {
    return locations.filter((location) => {
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
  const handleRealtimeEvent = useCallback(
    (payload: any) => {
      if (!isMountedRef.current) return;

      logger.debug('useLocations', 'Received realtime event:', payload);

      const { eventType, new: newRecord, old: oldRecord } = payload;

      setLocations((currentLocations) => {
        switch (eventType) {
          case 'INSERT':
            if (newRecord && newRecord.trip_id === tripId) {
              logger.debug('useLocations', 'Adding new location for trip:', tripId, newRecord);
              const normalized = normalizeSupabaseRow(newRecord);
              // Check if location already exists (by user_id) to avoid duplicates
              const existingIdx = currentLocations.findIndex(
                (loc) => loc.user_id === normalized.user_id
              );
              if (existingIdx >= 0) {
                // Replace existing with newer data
                const updated = [...currentLocations];
                updated[existingIdx] = normalized;
                return updated;
              }
              return [...currentLocations, normalized];
            }
            return currentLocations;

          case 'UPDATE':
            if (newRecord && newRecord.trip_id === tripId) {
              logger.debug('useLocations', 'Updating location for trip:', tripId, newRecord);
              const normalized = normalizeSupabaseRow(newRecord);
              const found = currentLocations.some((loc) => loc.user_id === normalized.user_id);
              if (found) {
                return currentLocations.map((loc) =>
                  loc.user_id === normalized.user_id ? normalized : loc
                );
              }
              // User not in list yet — treat as insert
              return [...currentLocations, normalized];
            }
            return currentLocations;

          case 'DELETE':
            if (oldRecord) {
              logger.debug('useLocations', 'Deleting location for trip:', tripId, oldRecord);
              return currentLocations.filter((loc) => loc.user_id !== oldRecord.user_id);
            }
            return currentLocations;

          default:
            return currentLocations;
        }
      });
    },
    [tripId]
  );

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

  // Transform raw Supabase rows to domain-typed MemberLocation objects
  const memberLocations = useMemo(() => locations.map(mapToMemberLocation), [locations]);

  // Setup and cleanup — fetch first, then subscribe for live updates
  useEffect(() => {
    isMountedRef.current = true;

    if (autoConnect) {
      fetchLocations().then(() => {
        if (isMountedRef.current) {
          connect();
        }
      });
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [autoConnect, fetchLocations, connect, disconnect]);

  return {
    locations,
    memberLocations,
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
