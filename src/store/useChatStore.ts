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
    logger.error('[ChatStore] Failed to persist messages:', error);
  }
};

const loadPersistedMessages = async (): Promise<{ messagesByTripId: Record<string, ChatMessageWithStatus[]> }> => {
  try {
    const storedData = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
    if (storedData) {
      return { messagesByTripId: JSON.parse(storedData) };
    }
  } catch (error) {
    logger.error('[ChatStore] Failed to load persisted messages:', error);
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
    const { messagesByTripId } = await loadPersistedMessages();
    set({ messagesByTripId });
  },

  // Connect to chat WebSocket
  connectToChat: async (tripId: string) => {
    try {
      logger.debug('[ChatStore] Initializing chat for trip:', tripId);
      // No need to connect to WebSocket here as it's managed at the trip level
      // Just initialize any chat-specific state
    } catch (error) {
      logger.error('[ChatStore] Failed to initialize chat:', error);
      set({ error: 'Failed to initialize chat' });
    }
  },

  // Disconnect from chat WebSocket
  disconnectFromChat: (tripId: string) => {
    try {
      logger.debug('[ChatStore] Cleaning up chat for trip:', tripId);
      // No need to disconnect from WebSocket here as it's managed at the trip level
      // Just clean up any chat-specific state
    } catch (error) {
      logger.error('[ChatStore] Error cleaning up chat:', error);
    }
  },

  // Actions
  fetchMessages: async (tripId: string, refresh = false) => {
    set({ isLoadingMessages: true, isLoading: true, errors: { ...get().errors, messages: null }, error: null });
    try {
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
        isLoading: false
      }));
      
      // Persist messages
      persistMessages({
        ...get().messagesByTripId,
        [tripId]: uniqueMessages
      });
      
    } catch (error) {
      logger.error('[ChatStore] Failed to fetch messages:', error);
      set({ 
        isLoadingMessages: false, 
        isLoading: false,
        errors: { ...get().errors, messages: 'Failed to fetch messages' },
        error: 'Failed to fetch messages'
      });
    }
  },

  // Add a stub for fetchChatGroups to maintain backward compatibility
  fetchChatGroups: (tripId: string) => {
    logger.debug('[ChatStore] fetchChatGroups called (deprecated)');
    // This is a no-op function to maintain backward compatibility
    // Since we've simplified the chat experience by eliminating separate chat groups
    // Each trip now functions as a chat group by default
    return Promise.resolve();
  },

  fetchMoreMessages: async (tripId: string) => {
    // Only fetch more if we have more to fetch and we're not already loading
    if (!get().hasMoreMessages[tripId] || get().isLoadingMessages) {
      return;
    }
    
    await get().fetchMessages(tripId, false);
  },

  sendMessage: async ({ tripId, content }: { tripId: string; content: string }) => {
    logger.info('[ChatStore]', `sendMessage called with tripId: ${tripId} and content: ${content.substring(0, 20)}${content.length > 20 ? '...' : ''}`);
    
    if (!tripId) {
      logger.error('[ChatStore]', 'Cannot send message: tripId is undefined');
      return;
    }
    
    // Check if user is logged in
    const { user } = useAuthStore.getState();
    if (!user) {
      logger.error('[ChatStore]', 'Cannot send message: user not logged in');
      return;
    }
    
    // Set sending state
    set({ isSending: true });
    
    // Create an optimistic message
    const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    logger.debug('[ChatStore]', `Creating optimistic message with ID: ${optimisticId}`);
    
    const optimisticMessage: ChatMessageWithStatus = {
      message: {
        id: optimisticId,
        content,
        sender: {
          id: user.id,
          name: user.username || user.firstName || 'You',
          avatar: user.profilePicture
        },
        createdAt: new Date().toISOString()
      },
      status: 'sending'
    };
    
    // Add the optimistic message to the state
    const existingMessages = get().messagesByTripId[tripId] || [];
    const updatedMessages = [optimisticMessage, ...existingMessages];
    
    logger.debug('[ChatStore]', `Adding optimistic message to state. Total messages: ${updatedMessages.length}`);
    
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
      
      logger.debug('[ChatStore]', `WebSocket manager instance obtained, connected: ${wsManager.isConnected()}`);
      
      // Check if WebSocket is connected
      if (!wsManager.isConnected()) {
        logger.warn('[ChatStore]', 'WebSocket not connected, attempting to connect');
        // Try to connect to the WebSocket
        await wsManager.connect(tripId);
        logger.debug('[ChatStore]', `WebSocket connection attempt completed, connected: ${wsManager.isConnected()}`);
      }
      
      // Send the message via WebSocket
      logger.info('[ChatStore]', 'Sending message via WebSocket');
      
      // Create the message payload with all required fields
      const messagePayload = {
        tripId,
        content,
        messageId: optimisticId,
        user: {
          id: user.id,
          name: user.username || user.firstName || 'You',
          avatar: user.profilePicture
        },
        timestamp: new Date().toISOString()
      };
      
      // Log the exact payload being sent
      logger.debug('[ChatStore]', 'Message payload:', JSON.stringify(messagePayload, null, 2));
      
      // Send the message with the correct event type
      const success = wsManager.send('CHAT_MESSAGE_SEND', messagePayload);
      
      if (!success) {
        logger.error('[ChatStore]', 'Failed to send message via WebSocket');
        throw new Error('Failed to send message via WebSocket');
      }
      
      logger.info('[ChatStore]', 'Message sent successfully via WebSocket');
      
      // Update the message status to 'sent' immediately to ensure UI shows the message
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
        isSending: false
      }));
      
      // Persist the updated messages with sent status
      persistMessages({
        ...get().messagesByTripId,
        [tripId]: updatedMessagesWithSentStatus
      });
      
      // Note: The actual message with server-generated ID will be received via WebSocket
      // and handled by the handleChatEvent function
      
    } catch (error) {
      logger.error('[ChatStore] Failed to send message:', error);
      
      // Update the message status to 'error'
      const updatedMessagesWithError = get().messagesByTripId[tripId]?.map(msg => 
        msg.message.id === optimisticMessage.message.id 
          ? { ...msg, status: 'error' as const, error: 'Failed to send message' }
          : msg
      ) || [];
      
      set(state => ({
        messagesByTripId: {
          ...state.messagesByTripId,
          [tripId]: updatedMessagesWithError
        },
        isSending: false
      }));
      
      // Persist the updated messages with error status
      persistMessages({
        ...get().messagesByTripId,
        [tripId]: updatedMessagesWithError
      });
    }
  },

  markAsRead: async (tripId: string, messageId: string) => {
    try {
      await chatService.updateLastRead(tripId, { message_id: messageId });
    } catch (error) {
      logger.error('[ChatStore] Failed to mark message as read:', error);
    }
  },

  handleChatEvent: (event: ServerEvent) => {
    logger.debug('[ChatStore] Handling chat event:', event.type);
    
    switch (event.type) {
      case 'MESSAGE_SENT': {
        const { tripId } = event;
        const { message } = event.payload;
        
        // Check if we already have this message (by ID or by temporary ID)
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
      
      case 'MESSAGE_EDITED': {
        const { tripId } = event;
        const { messageId, content } = event.payload;
        
        // Update the message content
        const existingMessages = get().messagesByTripId[tripId] || [];
        const updatedMessages = existingMessages.map(msg => 
          msg.message.id === messageId 
            ? { 
                ...msg, 
                message: { 
                  ...msg.message, 
                  content,
                  updated_at: new Date().toISOString()
                } 
              }
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
        break;
      }
      
      case 'MESSAGE_DELETED': {
        const { tripId } = event;
        const { messageId } = event.payload;
        
        // Remove the message
        const existingMessages = get().messagesByTripId[tripId] || [];
        const updatedMessages = existingMessages.filter(
          msg => msg.message.id !== messageId
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
        break;
      }
      
      case 'TYPING_STATUS': {
        const { tripId } = event;
        const { userId, isTyping, username } = event.payload;
        
        // Get current typing users for this group
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
        logger.warn('[ChatStore] Unknown chat event type:', event.type);
    }
  },

  setTypingStatus: async (tripId: string, isTyping: boolean) => {
    try {
      const wsManager = WebSocketManager.getInstance();
      
      if (!wsManager.isConnected()) {
        logger.warn('[ChatStore] WebSocket not connected, cannot send typing status');
        return;
      }
      
      wsManager.sendTypingStatus(tripId, isTyping);
    } catch (error) {
      logger.error('[ChatStore] Failed to send typing status:', error);
    }
  }
})); 