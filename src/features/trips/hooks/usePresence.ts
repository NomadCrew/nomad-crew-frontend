import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/src/features/auth/service';
import { logger } from '@/src/utils/logger';
import type { 
  UserPresence,
  SupabaseRealtimePayload 
} from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UsePresenceOptions {
  tripId: string;
  autoConnect?: boolean;
}

interface UsePresenceReturn {
  presenceData: UserPresence[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  getOnlineUsers: () => UserPresence[];
  getTypingUsers: () => UserPresence[];
  isUserOnline: (userId: string) => boolean;
  isUserTyping: (userId: string) => boolean;
  getUserPresence: (userId: string) => UserPresence | undefined;
}

export function usePresence({ 
  tripId, 
  autoConnect = true 
}: UsePresenceOptions): UsePresenceReturn {
  const [presenceData, setPresenceData] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  // Get online users
  const getOnlineUsers = useCallback((): UserPresence[] => {
    return presenceData.filter(presence => presence.is_online);
  }, [presenceData]);

  // Get typing users
  const getTypingUsers = useCallback((): UserPresence[] => {
    return presenceData.filter(presence => presence.is_typing && presence.is_online);
  }, [presenceData]);

  // Check if user is online
  const isUserOnline = useCallback((userId: string): boolean => {
    const presence = presenceData.find(p => p.user_id === userId);
    return presence?.is_online ?? false;
  }, [presenceData]);

  // Check if user is typing
  const isUserTyping = useCallback((userId: string): boolean => {
    const presence = presenceData.find(p => p.user_id === userId);
    return presence?.is_typing ?? false;
  }, [presenceData]);

  // Get user presence
  const getUserPresence = useCallback((userId: string): UserPresence | undefined => {
    return presenceData.find(p => p.user_id === userId);
  }, [presenceData]);

  // Handle realtime events
  const handleRealtimeEvent = useCallback((payload: SupabaseRealtimePayload<UserPresence>) => {
    if (!isMountedRef.current) return;

    logger.debug('usePresence', 'Received realtime event:', payload);

    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new && payload.new.trip_id === tripId) {
          setPresenceData(prev => {
            // Check if presence already exists for this user
            const existingIndex = prev.findIndex(p => p.user_id === payload.new.user_id);
            
            if (existingIndex >= 0) {
              // Update existing presence
              const updated = [...prev];
              updated[existingIndex] = payload.new;
              return updated;
            } else {
              // Add new presence
              return [...prev, payload.new];
            }
          });
        }
        break;

      case 'UPDATE':
        if (payload.new && payload.new.trip_id === tripId) {
          setPresenceData(prev => 
            prev.map(presence => 
              presence.user_id === payload.new.user_id ? payload.new : presence
            )
          );
        }
        break;

      case 'DELETE':
        if (payload.old && payload.old.trip_id === tripId) {
          setPresenceData(prev => 
            prev.filter(presence => presence.user_id !== payload.old.user_id)
          );
        }
        break;
    }
  }, [tripId]);

  // Connect to Supabase Realtime
  const connect = useCallback(() => {
    if (channelRef.current || !tripId) return;

    logger.debug('usePresence', 'Connecting to realtime for trip:', tripId);

    const channel = supabase
      .channel(`trip-presence-${tripId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'supabase_user_presence',
        filter: `trip_id=eq.${tripId}`,
      }, handleRealtimeEvent)
      .subscribe((status) => {
        logger.debug('usePresence', 'Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setError('Failed to connect to realtime presence');
        }
      });

    channelRef.current = channel;
  }, [tripId, handleRealtimeEvent]);

  // Disconnect from Supabase Realtime
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      logger.debug('usePresence', 'Disconnecting from realtime');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Auto-connect
  useEffect(() => {
    if (!tripId) return;

    // Connect to realtime if auto-connect is enabled
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [tripId, autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    presenceData,
    isLoading,
    error,
    isConnected,
    connect,
    disconnect,
    getOnlineUsers,
    getTypingUsers,
    isUserOnline,
    isUserTyping,
    getUserPresence,
  };
} 