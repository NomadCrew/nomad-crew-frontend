import { create } from 'zustand';
import { ChatState, ChatMessageWithStatus, ChatUser, PaginationInfo, ReadReceipt, ChatMessage } from './types';
import { chatService } from './service';
import { useAuthStore } from '@/src/features/auth/store';
import { logger } from '@/src/utils/logger';
import { ServerEvent } from '@/src/types/events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { v4 as uuidv4 } from 'uuid';
import { useEffect } from 'react';

// Constants
const MESSAGES_STORAGE_KEY = 'nomad_crew_chat_messages';
const READ_RECEIPTS_STORAGE_KEY = 'nomad_crew_read_receipts';
const LAST_READ_STORAGE_KEY = 'nomad_crew_last_read';
const TYPING_TIMEOUT = 5000; // 5 seconds

// Helper functions for persistence
const persistMessages = async (messagesByTripId: Record<string, ChatMessageWithStatus[]>) => {
  try {
    await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messagesByTripId));
  } catch (error) {
    logger.error('ChatStore', 'Failed to persist messages:', error);
  }
};

// Add persistence for read receipts
const persistReadReceipts = async (readReceipts: Record<string, Record<string, ReadReceipt[]>>) => {
  try {
    await AsyncStorage.setItem(READ_RECEIPTS_STORAGE_KEY, JSON.stringify(readReceipts));
  } catch (error) {
    logger.error('ChatStore', 'Failed to persist read receipts:', error);
  }
};

// Add persistence for last read message IDs
const persistLastReadMessageIds = async (lastReadMessageIds: Record<string, string>) => {
  try {
    await AsyncStorage.setItem(LAST_READ_STORAGE_KEY, JSON.stringify(lastReadMessageIds));
  } catch (error) {
    logger.error('ChatStore', 'Failed to persist last read message IDs:', error);
  }
};

const loadPersistedMessages = async (): Promise<{ messagesByTripId: Record<string, ChatMessageWithStatus[]> }> => {
  try {
    const storedData = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
    if (storedData) {
      return { messagesByTripId: JSON.parse(storedData) };
    }
  } catch (error) {
    logger.error('ChatStore', 'Failed to load persisted messages:', error);
  }
  return { messagesByTripId: {} };
};

// Add loading for read receipts
const loadPersistedReadReceipts = async (): Promise<{ readReceipts: Record<string, Record<string, ReadReceipt[]>> }> => {
  try {
    const storedData = await AsyncStorage.getItem(READ_RECEIPTS_STORAGE_KEY);
    if (storedData) {
      return { readReceipts: JSON.parse(storedData) };
    }
  } catch (error) {
    logger.error('ChatStore', 'Failed to load persisted read receipts:', error);
  }
  return { readReceipts: {} };
};

// Add loading for last read message IDs
const loadPersistedLastReadMessageIds = async (): Promise<{ lastReadMessageIds: Record<string, string> }> => {
  try {
    const storedData = await AsyncStorage.getItem(LAST_READ_STORAGE_KEY);
    if (storedData) {
      return { lastReadMessageIds: JSON.parse(storedData) };
    }
  } catch (error) {
    logger.error('ChatStore', 'Failed to load persisted last read message IDs:', error);
  }
  return { lastReadMessageIds: {} };
};

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messagesByTripId: {},
  isLoadingMessages: false,
  hasMoreMessages: {},
  messagePagination: {},
  typingUsers: {},
  errors: {},
  userCache: {},
  isSending: false,
  isLoading: false,
  error: null,
  // Add read receipt state
  lastReadMessageIds: {},
  readReceipts: {},

  // Initialize store with persisted data
  initializeStore: async () => {
    try {
      logger.debug('ChatStore', 'Initializing store with persisted data');
      const { messagesByTripId } = await loadPersistedMessages();
      const { readReceipts } = await loadPersistedReadReceipts();
      const { lastReadMessageIds } = await loadPersistedLastReadMessageIds();
      
      set({ 
        messagesByTripId,
        readReceipts,
        lastReadMessageIds
      });
      
      logger.debug('ChatStore', 'Store initialized successfully');
    } catch (error) {
      logger.error('ChatStore', 'Failed to initialize store:', error);
      set({ error: 'Failed to initialize chat store' });
    }
  },

  // Fetch messages
  fetchMessages: async (tripId: string, refresh = false) => {
    try {
      logger.debug('ChatStore', 'Fetching messages for trip:', tripId);
      set({ isLoadingMessages: true, isLoading: true, error: null });
      
      // Get pagination info
      const limit = 20;
      const cursor = refresh ? undefined : get().messagePagination[tripId]?.nextCursor;
      
      // Fetch messages from API
      const response = await chatService.getChatMessages(tripId, limit, cursor);
      
      // Process messages
      const messages = response.messages.map(message => ({
        message,
        status: 'sent' as const
      }));
      
      // Update state
      const existingMessages = refresh ? [] : get().messagesByTripId[tripId] || [];
      const updatedMessages = refresh ? messages : [...existingMessages, ...messages];
      
      // Remove duplicates (by message ID)
      const uniqueMessages = updatedMessages.filter((message, index, self) => 
        index === self.findIndex(m => m.message.id === message.message.id)
      );
      
      // Sort messages by creation date (newest first)
      uniqueMessages.sort((a, b) => 
        new Date(b.message.created_at).getTime() - new Date(a.message.created_at).getTime()
      );
      
      // Update state
      set(state => ({
        messagesByTripId: {
          ...state.messagesByTripId,
          [tripId]: uniqueMessages
        },
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [tripId]: response.pagination?.has_more || false
        },
        messagePagination: {
          ...state.messagePagination,
          [tripId]: {
            nextCursor: response.pagination?.next_cursor
          }
        },
        isLoadingMessages: false,
        isLoading: false,
        error: null
      }));
      
      // Persist messages
      persistMessages({
        ...get().messagesByTripId,
        [tripId]: uniqueMessages
      });
      
      logger.debug('ChatStore', 'Successfully fetched messages for trip:', tripId);
    } catch (error) {
      logger.error('ChatStore', 'Failed to fetch messages:', error);
      set({ 
        isLoadingMessages: false, 
        isLoading: false, 
        error: `Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  },

  // Fetch more messages (pagination)
  fetchMoreMessages: async (tripId: string) => {
    const { hasMoreMessages, isLoadingMessages } = get();
    
    // Don't fetch if already loading or no more messages
    if (isLoadingMessages || !hasMoreMessages[tripId]) {
      return;
    }
    
    await get().fetchMessages(tripId);
  },

  // Send a message
  sendChatMessage: async (tripId: string, content: string, optimisticId?: string) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      logger.error('ChatStore', 'User not authenticated, cannot send message');
      set({ error: 'User not authenticated' });
      return null;
    }

    const tempId = optimisticId || uuidv4();
    const user = useAuthStore.getState().user;
    const tempMessage: ChatMessageWithStatus = {
      message: {
        id: tempId,
        trip_id: tripId,
        content: content,
        sender: {
          id: userId,
          name: user?.username || user?.firstName || 'You',
          avatar: user?.profilePicture
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      status: 'pending'
    };

    // Optimistically add message to state
    set(state => ({
      messagesByTripId: {
        ...state.messagesByTripId,
        [tripId]: [tempMessage, ...(state.messagesByTripId[tripId] || [])]
      }
    }));

    try {
      // Call the API to send the message
      // The useChatMessages hook will handle the actual backend call and realtime update
      // This store method might just be for optimistic UI and local state management if still needed
      // For now, assume the hook handles the API call, and this is for local state update or legacy.
      // If this store method is truly redundant, it can be removed entirely later.
      logger.info('ChatStore', 'sendChatMessage called, optimistic update done. Actual send handled by useChatMessages hook.');
      
      // Simulate success for optimistic UI as WS part is removed
      const success = true; 

      if (!success) {
        // This block might be unreachable now or needs re-evaluation
        set(state => ({
          messagesByTripId: {
            ...state.messagesByTripId,
            [tripId]: (state.messagesByTripId[tripId] || []).map(msg => 
              msg.message.id === tempId ? { ...msg, status: 'failed' } : msg
            )
          },
          error: 'Failed to send message'
        }));
        return null;
      }

      // If API call was here and successful, update status to 'sent'
      // Since useChatMessages handles this, we might not need to update status here.
      // set(state => ({
      //   messagesByTripId: {
      //     ...state.messagesByTripId,
      //     [tripId]: (state.messagesByTripId[tripId] || []).map(msg => 
      //       msg.message.id === tempId ? { ...msg, status: 'sent' } : msg
      //     )
      //   }
      // }));
      return tempMessage.message; // Return the optimistically created message

    } catch (error) {
      logger.error('ChatStore', 'Error in sendChatMessage (after WS removal):', error);
      set(state => ({
        messagesByTripId: {
          ...state.messagesByTripId,
          [tripId]: (state.messagesByTripId[tripId] || []).map(msg => 
            msg.message.id === tempId ? { ...msg, status: 'failed' } : msg
          )
        },
        error: error instanceof Error ? error.message : 'Failed to send message'
      }));
      return null;
    }
  },

  // Mark a message as read
  markAsRead: async (tripId: string, messageId: string) => {
    try {
      logger.debug('ChatStore', `Marking message ${messageId} as read in trip ${tripId}`);
      
      // Get the current user
      const { user } = useAuthStore.getState();
      if (!user) {
        logger.error('ChatStore', 'Cannot mark message as read: user not logged in');
        return;
      }
      
      // Check if this message is already the last read message for this trip
      const currentLastReadMessageId = get().lastReadMessageIds[tripId];
      if (currentLastReadMessageId === messageId) {
        logger.debug('ChatStore', `Message ${messageId} is already marked as last read`);
        return;
      }
      
      // Update the last read message ID in the store
      set(state => ({
        lastReadMessageIds: {
          ...state.lastReadMessageIds,
          [tripId]: messageId
        }
      }));
      
      // Persist the updated last read message IDs
      persistLastReadMessageIds({
        ...get().lastReadMessageIds,
        [tripId]: messageId
      });
      
      // Create a read receipt
      const readReceipt: ReadReceipt = {
        user_id: user.id,
        user_name: user.username || user.firstName || 'You',
        user_avatar: user.profilePicture,
        message_id: messageId,
        timestamp: new Date().toISOString()
      };
      
      // Update the read receipt in the store
      get().updateReadReceipt(tripId, messageId, readReceipt);
      
      // Send the read receipt to the server
      try {
        // Call the API to update the last read message
        await api.post(API_PATHS.CHAT.UPDATE_LAST_READ(tripId), { message_id: messageId });
        
        logger.debug('ChatStore', `Successfully marked message ${messageId} as read`);
      } catch (error) {
        logger.error('ChatStore', 'Failed to send read receipt to server:', error);
      }
    } catch (error) {
      logger.error('ChatStore', 'Failed to mark message as read:', error);
    }
  },
  
  // Update a read receipt
  updateReadReceipt: (tripId: string, messageId: string, readReceipt: ReadReceipt) => {
    logger.debug('ChatStore', `Updating read receipt for message ${messageId} in trip ${tripId}`);
    
    // Get the current read receipts for this trip
    const tripReadReceipts = get().readReceipts[tripId] || {};
    
    // Get the current read receipts for this message
    const messageReadReceipts = tripReadReceipts[messageId] || [];
    
    // Check if this user already has a read receipt for this message
    const existingIndex = messageReadReceipts.findIndex(receipt => receipt.user_id === readReceipt.user_id);
    
    // Update or add the read receipt
    let updatedMessageReadReceipts: ReadReceipt[];
    if (existingIndex >= 0) {
      // Update the existing read receipt
      updatedMessageReadReceipts = [...messageReadReceipts];
      updatedMessageReadReceipts[existingIndex] = readReceipt;
    } else {
      // Add a new read receipt
      updatedMessageReadReceipts = [...messageReadReceipts, readReceipt];
    }
    
    // Update the read receipts in the store
    set(state => ({
      readReceipts: {
        ...state.readReceipts,
        [tripId]: {
          ...tripReadReceipts,
          [messageId]: updatedMessageReadReceipts
        }
      }
    }));
    
    // Update the readBy property of the message
    const messages = get().messagesByTripId[tripId] || [];
    const messageIndex = messages.findIndex(msg => msg.message.id === messageId);
    
    if (messageIndex >= 0) {
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        readBy: updatedMessageReadReceipts
      };
      
      set(state => ({
        messagesByTripId: {
          ...state.messagesByTripId,
          [tripId]: updatedMessages
        }
      }));
      
      // Persist the updated messages
      persistMessages({
        ...get().messagesByTripId,
        [tripId]: updatedMessages
      });
    }
    
    // Persist the updated read receipts
    persistReadReceipts({
      ...get().readReceipts,
      [tripId]: {
        ...tripReadReceipts,
        [messageId]: updatedMessageReadReceipts
      }
    });
  },
  
  // Get read receipts for a message
  getReadReceipts: (tripId: string, messageId: string): ReadReceipt[] => {
    const tripReadReceipts = get().readReceipts[tripId] || {};
    return tripReadReceipts[messageId] || [];
  },
  
  // Get the last read message ID for a trip
  getLastReadMessageId: (tripId: string): string | undefined => {
    return get().lastReadMessageIds[tripId];
  },

  // Set typing status
  setTypingStatus: async (tripId: string, isTyping: boolean) => {
    // This method is not used in the simplified version
  },

  // WebSocket compatibility methods (stubs for Supabase Realtime migration)
  connectToChat: async (tripId: string) => {
    // No-op: Supabase Realtime handles connections automatically
    logger.debug('ChatStore', `connectToChat called for trip ${tripId} - using Supabase Realtime`);
  },

  disconnectFromChat: (tripId: string) => {
    // No-op: Supabase Realtime handles disconnections automatically
    logger.debug('ChatStore', `disconnectFromChat called for trip ${tripId} - using Supabase Realtime`);
  },

  sendMessage: async (params: { tripId: string; content: string }) => {
    // Delegate to sendChatMessage for backward compatibility
    return await get().sendChatMessage(params.tripId, params.content);
  },

  handleChatEvent: (event: ServerEvent) => {
    // No-op: Supabase Realtime handles events automatically
    logger.debug('ChatStore', 'handleChatEvent called - using Supabase Realtime');
  }
})); 