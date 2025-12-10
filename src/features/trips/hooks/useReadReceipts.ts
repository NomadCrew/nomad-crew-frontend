import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/src/features/auth/service';
import { api } from '@/src/api/api-client';
import { logger } from '@/src/utils/logger';
import type { 
  ChatReadReceipt, 
  UpdateLastReadRequest,
  SupabaseRealtimePayload 
} from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseReadReceiptsOptions {
  tripId: string;
  autoConnect?: boolean;
}

interface UseReadReceiptsReturn {
  readReceipts: ChatReadReceipt[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  updateLastRead: (messageId: string) => Promise<void>;
  getReadReceiptsForMessage: (messageId: string) => ChatReadReceipt[];
  getLastReadByUser: (userId: string) => ChatReadReceipt | undefined;
  hasUserRead: (messageId: string, userId: string) => boolean;
  getUnreadCount: (userId: string, messages: { id: string; created_at: string }[]) => number;
  connect: () => void;
  disconnect: () => void;
}

export function useReadReceipts({ 
  tripId, 
  autoConnect = true 
}: UseReadReceiptsOptions): UseReadReceiptsReturn {
  const [readReceipts, setReadReceipts] = useState<ChatReadReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  // Update last read message via REST API
  const updateLastRead = useCallback(async (messageId: string) => {
    try {
      const payload: UpdateLastReadRequest = { last_message_id: messageId };
      await api.put(`/trips/${tripId}/chat/last-read`, payload);
      // Read receipt will be updated via realtime subscription
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update read status';
      setError(errorMessage);
      logger.error('useReadReceipts', 'Failed to update read status:', err);
      throw err;
    }
  }, [tripId]);

  // Get read receipts for a specific message
  const getReadReceiptsForMessage = useCallback((messageId: string): ChatReadReceipt[] => {
    return readReceipts.filter(receipt => receipt.message_id === messageId);
  }, [readReceipts]);

  // Get last read receipt by user
  const getLastReadByUser = useCallback((userId: string): ChatReadReceipt | undefined => {
    const userReceipts = readReceipts
      .filter(receipt => receipt.user_id === userId)
      .sort((a, b) => new Date(b.read_at).getTime() - new Date(a.read_at).getTime());
    
    return userReceipts[0];
  }, [readReceipts]);

  // Check if user has read a specific message
  const hasUserRead = useCallback((messageId: string, userId: string): boolean => {
    return readReceipts.some(receipt => 
      receipt.message_id === messageId && receipt.user_id === userId
    );
  }, [readReceipts]);

  // Get unread count for a user
  const getUnreadCount = useCallback((
    userId: string, 
    messages: { id: string; created_at: string }[]
  ): number => {
    const lastRead = getLastReadByUser(userId);
    
    if (!lastRead) {
      return messages.length;
    }

    const lastReadTime = new Date(lastRead.read_at).getTime();
    
    return messages.filter(message => {
      const messageTime = new Date(message.created_at).getTime();
      return messageTime > lastReadTime;
    }).length;
  }, [getLastReadByUser]);

  // Handle realtime events
  const handleRealtimeEvent = useCallback((payload: SupabaseRealtimePayload<ChatReadReceipt>) => {
    if (!isMountedRef.current) return;

    logger.debug('useReadReceipts', 'Received realtime event:', payload);

    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new && payload.new.trip_id === tripId) {
          setReadReceipts(prev => {
            // Check if read receipt already exists to prevent duplicates
            const exists = prev.some(r => r.id === payload.new.id);
            if (exists) return prev;
            
            return [...prev, payload.new];
          });
        }
        break;

      case 'UPDATE':
        if (payload.new && payload.new.trip_id === tripId) {
          setReadReceipts(prev => 
            prev.map(receipt => 
              receipt.id === payload.new.id ? payload.new : receipt
            )
          );
        }
        break;

      case 'DELETE':
        if (payload.old && payload.old.trip_id === tripId) {
          setReadReceipts(prev => 
            prev.filter(receipt => receipt.id !== payload.old.id)
          );
        }
        break;
    }
  }, [tripId]);

  // Connect to Supabase Realtime
  const connect = useCallback(() => {
    if (channelRef.current || !tripId) return;

    logger.debug('useReadReceipts', 'Connecting to realtime for trip:', tripId);

    const channel = supabase
      .channel(`trip-read-receipts-${tripId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'supabase_chat_read_receipts',
        filter: `trip_id=eq.${tripId}`,
      }, handleRealtimeEvent)
      .subscribe((status) => {
        logger.debug('useReadReceipts', 'Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setError('Failed to connect to realtime read receipts');
        }
      });

    channelRef.current = channel;
  }, [tripId, handleRealtimeEvent]);

  // Disconnect from Supabase Realtime
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      logger.debug('useReadReceipts', 'Disconnecting from realtime');
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
    readReceipts,
    isLoading,
    error,
    isConnected,
    updateLastRead,
    getReadReceiptsForMessage,
    getLastReadByUser,
    hasUserRead,
    getUnreadCount,
    connect,
    disconnect,
  };
} 