import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/src/features/auth/service';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { logger } from '@/src/utils/logger';
import type { 
  ChatMessage, 
  ChatMessagePaginatedResponse, 
  SendMessageRequest,
  SupabaseRealtimePayload 
} from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseChatMessagesOptions {
  tripId: string;
  limit?: number;
  autoConnect?: boolean;
}

interface UseChatMessagesReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  isConnected: boolean;
  sendMessage: (content: string, replyToId?: string) => Promise<void>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  connect: () => void;
  disconnect: () => void;
}

export function useChatMessages({ 
  tripId, 
  limit = 50, 
  autoConnect = true 
}: UseChatMessagesOptions): UseChatMessagesReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  // Fetch messages from REST API
  const fetchMessages = useCallback(async (offset = 0, refresh = false) => {
    try {
      if (refresh) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const response = await api.get<ChatMessagePaginatedResponse>(
        API_PATHS.trips.messages(tripId),
        {
          params: {
            limit,
            offset,
          },
        }
      );

      if (!isMountedRef.current) return;

      const { messages: newMessages, pagination } = response.data;
      
      if (refresh || offset === 0) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...prev, ...newMessages]);
      }

      setHasMore(pagination.has_more);
      setNextCursor(pagination.next_cursor);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
      logger.error('useChatMessages', 'Failed to fetch messages:', err);
    } finally {
      if (!isMountedRef.current) return;
      
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [tripId, limit]);

  // Send message via REST API
  const sendMessage = useCallback(async (content: string, replyToId?: string) => {
    try {
      const payload: SendMessageRequest = {
        message: content,
        ...(replyToId && { replyToId }),
      };

      await api.post(API_PATHS.trips.messages(tripId), payload);
      // Message will be added via realtime subscription
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      logger.error('useChatMessages', 'Failed to send message:', err);
      throw err;
    }
  }, [tripId]);

  // Update message via REST API
  const updateMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await api.put(`${API_PATHS.trips.messages(tripId)}/${messageId}`, { content });
      // Message will be updated via realtime subscription
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update message';
      setError(errorMessage);
      logger.error('useChatMessages', 'Failed to update message:', err);
      throw err;
    }
  }, [tripId]);

  // Delete message via REST API
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await api.delete(`${API_PATHS.trips.messages(tripId)}/${messageId}`);
      // Message will be removed via realtime subscription
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
      setError(errorMessage);
      logger.error('useChatMessages', 'Failed to delete message:', err);
      throw err;
    }
  }, [tripId]);

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    await fetchMessages(messages.length, false);
  }, [fetchMessages, hasMore, isLoadingMore, messages.length]);

  // Refresh messages
  const refreshMessages = useCallback(async () => {
    await fetchMessages(0, true);
  }, [fetchMessages]);

  // Handle realtime events
  const handleRealtimeEvent = useCallback((payload: SupabaseRealtimePayload<ChatMessage>) => {
    if (!isMountedRef.current) return;

    logger.debug('useChatMessages', 'Received realtime event:', payload);

    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new && payload.new.trip_id === tripId) {
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const exists = prev.some(msg => msg.id === payload.new.id);
            if (exists) return prev;
            
            // Insert new message in chronological order
            const newMessages = [...prev, payload.new];
            return newMessages.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        }
        break;

      case 'UPDATE':
        if (payload.new && payload.new.trip_id === tripId) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id ? payload.new : msg
            )
          );
        }
        break;

      case 'DELETE':
        if (payload.old && payload.old.trip_id === tripId) {
          setMessages(prev => 
            prev.filter(msg => msg.id !== payload.old.id)
          );
        }
        break;
    }
  }, [tripId]);

  // Connect to Supabase Realtime
  const connect = useCallback(() => {
    if (channelRef.current || !tripId) return;

    logger.debug('useChatMessages', 'Connecting to realtime for trip:', tripId);

    const channel = supabase
      .channel(`trip-messages-${tripId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'supabase_chat_messages',
        filter: `trip_id=eq.${tripId}`,
      }, handleRealtimeEvent)
      .subscribe((status) => {
        logger.debug('useChatMessages', 'Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setError('Failed to connect to realtime chat');
        }
      });

    channelRef.current = channel;
  }, [tripId, handleRealtimeEvent]);

  // Disconnect from Supabase Realtime
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      logger.debug('useChatMessages', 'Disconnecting from realtime');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Auto-connect and fetch initial messages
  useEffect(() => {
    if (!tripId) return;

    // Fetch initial messages
    fetchMessages(0, true);

    // Connect to realtime if auto-connect is enabled
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [tripId, autoConnect, fetchMessages, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    isConnected,
    sendMessage,
    updateMessage,
    deleteMessage,
    loadMoreMessages,
    refreshMessages,
    connect,
    disconnect,
  };
} 