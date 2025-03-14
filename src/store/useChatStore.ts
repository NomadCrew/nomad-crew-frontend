import { create } from 'zustand';
import { ChatState, ChatMessageWithStatus, ChatUser, PaginationInfo } from '@/src/types/chat';
import { chatService } from '@/src/services/chatService';
import { useAuthStore } from './useAuthStore';
import { logger } from '@/src/utils/logger';
import { ServerEvent } from '@/src/types/events';
import { WebSocketManager } from '@/src/websocket/WebSocketManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { v4 as uuidv4 } from 'uuid';
import { useEffect } from 'react';

// Constants
const MESSAGES_STORAGE_KEY = 'nomad_crew_chat_messages';
const TYPING_TIMEOUT = 5000; // 5 seconds

// Helper functions for persistence
const persistMessages = async (messagesByTripId: Record<string, ChatMessageWithStatus[]>) => {
  try {
    await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messagesByTripId));
  } catch (error) {
    logger.error('ChatStore', 'Failed to persist messages:', error);
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

  // Initialize store with persisted data
  initializeStore: async () => {
    try {
      logger.debug('ChatStore', 'Initializing store with persisted data');
      const { messagesByTripId } = await loadPersistedMessages();
      set({ messagesByTripId });
      logger.debug('ChatStore', 'Store initialized successfully');
    } catch (error) {
      logger.error('ChatStore', 'Failed to initialize store:', error);
      set({ error: 'Failed to initialize chat store' });
    }
  },

  // Connect to chat WebSocket
  connectToChat: async (tripId: string) => {
    try {
      logger.debug('ChatStore', 'Connecting to chat for trip:', tripId);
      
      // Clear any previous errors
      set({ error: null });
      
      // Get the WebSocket manager instance
      const wsManager = WebSocketManager.getInstance();
      
      // Set up callbacks for WebSocket events
      const callbacks = {
        onMessage: (event: ServerEvent) => {
          get().handleChatEvent(event);
        },
        onError: (error: Error) => {
          logger.error('ChatStore', 'WebSocket error:', error);
          set({ error: `WebSocket error: ${error.message}` });
        }
      };
      
      // Connect to WebSocket
      await wsManager.connect(tripId, callbacks);
      logger.debug('ChatStore', 'Connected to chat WebSocket for trip:', tripId);
      
      // Initialize store if not already initialized
      if (Object.keys(get().messagesByTripId).length === 0) {
        await get().initializeStore();
      }
    } catch (error) {
      logger.error('ChatStore', 'Failed to connect to chat:', error);
      set({ error: `Failed to connect to chat: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  },

  // Disconnect from chat WebSocket
  disconnectFromChat: (tripId: string) => {
    try {
      logger.debug('ChatStore', 'Disconnecting from chat for trip:', tripId);
      
      // Get the WebSocket manager instance
      const wsManager = WebSocketManager.getInstance();
      
      // Disconnect from WebSocket
      wsManager.disconnect();
      logger.debug('ChatStore', 'Disconnected from chat WebSocket for trip:', tripId);
    } catch (error) {
      logger.error('ChatStore', 'Error disconnecting from chat:', error);
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
  sendMessage: async ({ tripId, content }: { tripId: string; content: string }) => {
    logger.debug('ChatStore', 'Sending message for trip:', tripId);
    
    if (!tripId) {
      logger.error('ChatStore', 'Cannot send message: tripId is undefined');
      return;
    }
    
    // Check if user is logged in
    const { user } = useAuthStore.getState();
    if (!user) {
      logger.error('ChatStore', 'Cannot send message: user not logged in');
      set({ error: 'Cannot send message: You are not logged in' });
      return;
    }
    
    // Set sending state
    set({ isSending: true });
    
    // Create an optimistic message with a temporary ID
    const optimisticId = uuidv4();
    
    const optimisticMessage: ChatMessageWithStatus = {
      message: {
        id: optimisticId,
        trip_id: tripId,
        content,
        sender: {
          id: user.id,
          name: user.username || user.firstName || 'You',
          avatar: user.profilePicture
        },
        created_at: new Date().toISOString()
      },
      status: 'sending'
    };
    
    // Add the optimistic message to the state
    const existingMessages = get().messagesByTripId[tripId] || [];
    const updatedMessages = [optimisticMessage, ...existingMessages];
    
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

    try {
      // Get the WebSocket manager instance
      const wsManager = WebSocketManager.getInstance();
      
      // Check if WebSocket is connected
      if (!wsManager.isConnected()) {
        logger.warn('ChatStore', 'WebSocket not connected, attempting to connect');
        // Try to connect to the WebSocket
        await wsManager.connect(tripId, {
          onMessage: (event) => get().handleChatEvent(event)
        });
      }
      
      // Send the message via WebSocket
      const success = wsManager.sendChatMessage(tripId, content, optimisticId);
      
      if (!success) {
        throw new Error('Failed to send message via WebSocket');
      }
      
      // Update the message status to 'sent'
      const updatedMessagesWithSentStatus = get().messagesByTripId[tripId]?.map(msg => 
        msg.message.id === optimisticId 
          ? { ...msg, status: 'sent' as const }
          : msg
      ) || [];
      
      set(state => ({
        messagesByTripId: {
          ...state.messagesByTripId,
          [tripId]: updatedMessagesWithSentStatus
        },
        isSending: false,
        error: null
      }));
      
      // Persist the updated messages with sent status
      persistMessages({
        ...get().messagesByTripId,
        [tripId]: updatedMessagesWithSentStatus
      });
      
    } catch (error) {
      logger.error('ChatStore', 'Failed to send message:', error);
      
      // Update the message status to 'error'
      const updatedMessagesWithError = get().messagesByTripId[tripId]?.map(msg => 
        msg.message.id === optimisticId 
          ? { ...msg, status: 'error' as const, error: 'Failed to send message' }
          : msg
      ) || [];
      
      set(state => ({
        messagesByTripId: {
          ...state.messagesByTripId,
          [tripId]: updatedMessagesWithError
        },
        isSending: false,
        error: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
      
      // Persist the updated messages with error status
      persistMessages({
        ...get().messagesByTripId,
        [tripId]: updatedMessagesWithError
      });
    }
  },

  // Mark a message as read
  markAsRead: async (tripId: string, messageId: string) => {
    try {
      await chatService.updateLastRead(tripId, { message_id: messageId });
    } catch (error) {
      logger.error('ChatStore', 'Failed to mark message as read:', error);
    }
  },

  // Handle chat events from WebSocket
  handleChatEvent: (event: ServerEvent) => {
    logger.debug('ChatStore', 'Handling chat event:', event.type);
    
    switch (event.type) {
      case 'CHAT_MESSAGE_SENT':
      case 'MESSAGE_SENT': {
        const { tripId } = event;
        const { message } = event.payload;
        
        if (!message || !tripId) {
          logger.warn('ChatStore', 'Invalid message event payload:', event);
          return;
        }
        
        // Check if we already have this message (by ID)
        const existingMessages = get().messagesByTripId[tripId] || [];
        const messageExists = existingMessages.some(
          msg => msg.message.id === message.id
        );
        
        if (messageExists) {
          // If we already have this message, update it
          const updatedMessages = existingMessages.map(msg => 
            msg.message.id === message.id 
              ? { message, status: 'sent' as const }
              : msg
          );
          
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
        } else {
          // If we don't have this message, add it
          const newMessage: ChatMessageWithStatus = {
            message,
            status: 'sent'
          };
          
          const updatedMessages = [newMessage, ...existingMessages];
          
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
        break;
      }
      
      case 'TYPING_STATUS': {
        const { tripId } = event;
        const { userId, isTyping, username } = event.payload;
        
        if (!userId || !tripId) {
          logger.warn('ChatStore', 'Invalid typing status event payload:', event);
          return;
        }
        
        // Get current typing users for this trip
        const currentTypingUsers = get().typingUsers[tripId] || [];
        
        if (isTyping) {
          // Add user to typing users if not already there
          const userIndex = currentTypingUsers.findIndex(u => u.userId === userId);
          
          if (userIndex === -1) {
            // User not in typing list, add them
            const updatedTypingUsers = [
              ...currentTypingUsers,
              { userId, name: username, timestamp: Date.now() }
            ];
            
            set(state => ({
              typingUsers: {
                ...state.typingUsers,
                [tripId]: updatedTypingUsers
              }
            }));
          } else {
            // User already in typing list, update timestamp
            const updatedTypingUsers = [...currentTypingUsers];
            updatedTypingUsers[userIndex] = {
              ...updatedTypingUsers[userIndex],
              timestamp: Date.now()
            };
            
            set(state => ({
              typingUsers: {
                ...state.typingUsers,
                [tripId]: updatedTypingUsers
              }
            }));
          }
        } else {
          // Remove user from typing users
          const updatedTypingUsers = currentTypingUsers.filter(
            u => u.userId !== userId
          );
          
          set(state => ({
            typingUsers: {
              ...state.typingUsers,
              [tripId]: updatedTypingUsers
            }
          }));
        }
        break;
      }
      
      case 'MESSAGE_READ': {
        // We don't need to update the UI for read receipts in this simplified version
        break;
      }
      
      default:
        logger.warn('ChatStore', 'Unknown chat event type:', event.type);
    }
  },

  // Set typing status
  setTypingStatus: async (tripId: string, isTyping: boolean) => {
    try {
      const wsManager = WebSocketManager.getInstance();
      
      if (!wsManager.isConnected()) {
        logger.warn('ChatStore', 'WebSocket not connected, cannot send typing status');
        return;
      }
      
      wsManager.sendTypingStatus(tripId, isTyping);
    } catch (error) {
      logger.error('ChatStore', 'Failed to send typing status:', error);
    }
  }
})); 