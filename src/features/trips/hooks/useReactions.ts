import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/src/features/auth/service';
import { api } from '@/src/api/api-client';
import { logger } from '@/src/utils/logger';
import type { 
  ChatReaction, 
  AddReactionRequest,
  SupabaseRealtimePayload 
} from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseReactionsOptions {
  tripId: string;
  messageId?: string;
  autoConnect?: boolean;
}

interface UseReactionsReturn {
  reactions: ChatReaction[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, reactionType: string) => Promise<void>;
  getReactionsForMessage: (messageId: string) => ChatReaction[];
  getReactionsByEmoji: (messageId: string, emoji: string) => ChatReaction[];
  hasUserReacted: (messageId: string, emoji: string, userId: string) => boolean;
  getReactionCounts: (messageId: string) => Record<string, number>;
  connect: () => void;
  disconnect: () => void;
}

export function useReactions({ 
  tripId, 
  messageId,
  autoConnect = true 
}: UseReactionsOptions): UseReactionsReturn {
  const [reactions, setReactions] = useState<ChatReaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  // Fetch reactions for a specific message
  const fetchReactionsForMessage = useCallback(async (msgId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get<ChatReaction[]>(
        `/trips/${tripId}/chat/messages/${msgId}/reactions`
      );

      if (!isMountedRef.current) return;

      // If we're fetching for a specific message, replace only those reactions
      if (messageId === msgId) {
        setReactions(response.data);
      } else {
        // Otherwise, merge with existing reactions
        setReactions(prev => {
          const filtered = prev.filter(r => r.message_id !== msgId);
          return [...filtered, ...response.data];
        });
      }

      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reactions';
      setError(errorMessage);
      logger.error('useReactions', 'Failed to fetch reactions:', err);
    } finally {
      if (!isMountedRef.current) return;
      setIsLoading(false);
    }
  }, [tripId, messageId]);

  // Add reaction via REST API
  const addReaction = useCallback(async (msgId: string, emoji: string) => {
    try {
      const payload: AddReactionRequest = { emoji };
      await api.post(`/trips/${tripId}/chat/messages/${msgId}/reactions`, payload);
      // Reaction will be added via realtime subscription
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add reaction';
      setError(errorMessage);
      logger.error('useReactions', 'Failed to add reaction:', err);
      throw err;
    }
  }, [tripId]);

  // Remove reaction via REST API
  const removeReaction = useCallback(async (msgId: string, reactionType: string) => {
    try {
      await api.delete(`/trips/${tripId}/chat/messages/${msgId}/reactions/${reactionType}`);
      // Reaction will be removed via realtime subscription
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove reaction';
      setError(errorMessage);
      logger.error('useReactions', 'Failed to remove reaction:', err);
      throw err;
    }
  }, [tripId]);

  // Get reactions for a specific message
  const getReactionsForMessage = useCallback((msgId: string): ChatReaction[] => {
    return reactions.filter(reaction => reaction.message_id === msgId);
  }, [reactions]);

  // Get reactions by emoji for a specific message
  const getReactionsByEmoji = useCallback((msgId: string, emoji: string): ChatReaction[] => {
    return reactions.filter(reaction => 
      reaction.message_id === msgId && reaction.emoji === emoji
    );
  }, [reactions]);

  // Check if user has reacted with specific emoji
  const hasUserReacted = useCallback((msgId: string, emoji: string, userId: string): boolean => {
    return reactions.some(reaction => 
      reaction.message_id === msgId && 
      reaction.emoji === emoji && 
      reaction.user_id === userId
    );
  }, [reactions]);

  // Get reaction counts by emoji for a message
  const getReactionCounts = useCallback((msgId: string): Record<string, number> => {
    const messageReactions = getReactionsForMessage(msgId);
    const counts: Record<string, number> = {};
    
    messageReactions.forEach(reaction => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
    });
    
    return counts;
  }, [getReactionsForMessage]);

  // Handle realtime events
  const handleRealtimeEvent = useCallback((payload: SupabaseRealtimePayload<ChatReaction>) => {
    if (!isMountedRef.current) return;

    logger.debug('useReactions', 'Received realtime event:', payload);

    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new) {
          setReactions(prev => {
            // Check if reaction already exists to prevent duplicates
            const exists = prev.some(r => r.id === payload.new.id);
            if (exists) return prev;
            
            return [...prev, payload.new];
          });
        }
        break;

      case 'UPDATE':
        if (payload.new) {
          setReactions(prev => 
            prev.map(reaction => 
              reaction.id === payload.new.id ? payload.new : reaction
            )
          );
        }
        break;

      case 'DELETE':
        if (payload.old) {
          setReactions(prev => 
            prev.filter(reaction => reaction.id !== payload.old.id)
          );
        }
        break;
    }
  }, []);

  // Connect to Supabase Realtime
  const connect = useCallback(() => {
    if (channelRef.current || !tripId) return;

    logger.debug('useReactions', 'Connecting to realtime for trip:', tripId);

    const channel = supabase
      .channel(`trip-reactions-${tripId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'supabase_chat_reactions',
        // Note: We subscribe to all reactions for the trip, not filtered by message
        // This allows us to get reactions for all messages in the trip
      }, handleRealtimeEvent)
      .subscribe((status) => {
        logger.debug('useReactions', 'Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setError('Failed to connect to realtime reactions');
        }
      });

    channelRef.current = channel;
  }, [tripId, handleRealtimeEvent]);

  // Disconnect from Supabase Realtime
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      logger.debug('useReactions', 'Disconnecting from realtime');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Auto-connect and fetch initial reactions
  useEffect(() => {
    if (!tripId) return;

    // Fetch initial reactions for specific message if provided
    if (messageId) {
      fetchReactionsForMessage(messageId);
    }

    // Connect to realtime if auto-connect is enabled
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [tripId, messageId, autoConnect, fetchReactionsForMessage, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    reactions,
    isLoading,
    error,
    isConnected,
    addReaction,
    removeReaction,
    getReactionsForMessage,
    getReactionsByEmoji,
    hasUserReacted,
    getReactionCounts,
    connect,
    disconnect,
  };
} 