import { create } from 'zustand';
import { 
  ChatState, 
  ChatGroup, 
  ChatMessage, 
  ChatUser,
  ChatWebSocketEvent,
  MessageStatus,
  MessageWithStatus,
  PaginationInfo
} from '@/src/types/chat';
import { ServerEvent } from '@/src/types/events';
import { api } from '@/src/api/api-client';
import { logger } from '@/src/utils/logger';
import { useAuthStore } from '@/src/store/useAuthStore';
import { WebSocketManager } from '@/src/websocket/WebSocketManager';
import { API_PATHS } from '@/src/utils/api-paths';

const MESSAGES_PER_PAGE = 20;

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  groups: [],
  selectedGroupId: null,
  isLoadingGroups: false,
  messagesByGroupId: {},
  isLoadingMessages: false,
  hasMoreMessages: {},
  messagePagination: {},
  membersByGroupId: {},
  isLoadingMembers: false,
  typingUsers: {},
  errors: {},
  userCache: {},

  // Actions
  fetchChatGroups: async (tripId?: string) => {
    set({ isLoadingGroups: true, errors: { ...get().errors, groups: null } });
    try {
      const url = tripId 
        ? `${API_PATHS.chats.groups}?tripID=${tripId}`
        : API_PATHS.chats.groups;
      const response = await api.get(url);
      const rawGroups = response.data.groups;
      if (rawGroups === null || rawGroups === undefined) {
        logger.warn('[ChatStore] Groups API returned null/undefined instead of empty array:', {
          tripId,
          response: response.data
        });
      }
      const groups = (rawGroups || []).map((group: any) => ({
        ...group,
        unreadCount: 0, // Will be updated when fetching messages
      }));
      set({ groups, isLoadingGroups: false });
    } catch (error) {
      set({ 
        isLoadingGroups: false, 
        errors: { ...get().errors, groups: 'Failed to fetch chat groups' }
      });
      throw error;
    }
  },

  selectChatGroup: (groupId: string) => {
    set({ selectedGroupId: groupId });
    const { fetchMessages, fetchGroupMembers } = get();
    fetchMessages(groupId);
    fetchGroupMembers(groupId);
  },

  fetchMessages: async (groupId: string, refresh = false) => {
    set({ 
      isLoadingMessages: true, 
      errors: { ...get().errors, messages: null }
    });

    try {
      const pagination = get().messagePagination[groupId] || { offset: 0, limit: MESSAGES_PER_PAGE };
      if (refresh) {
        pagination.offset = 0;
      }

      const response = await api.get(
        `${API_PATHS.chats.messages(groupId)}?limit=${pagination.limit}&offset=${pagination.offset}`
      );

      const { messages: rawMessages, pagination: newPagination } = response.data;
      if (rawMessages === null || rawMessages === undefined) {
        logger.warn('[ChatStore] Messages API returned null/undefined instead of empty array:', {
          groupId,
          pagination,
          response: response.data
        });
      }
      const messages = rawMessages || [];

      // Update user cache
      const userCache = { ...get().userCache };
      messages.forEach((msg: ChatMessage) => {
        userCache[msg.user.id] = msg.user;
      });

      set(state => ({
        messagesByGroupId: {
          ...state.messagesByGroupId,
          [groupId]: refresh 
            ? messages 
            : [...(state.messagesByGroupId[groupId] || []), ...messages]
        },
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [groupId]: messages.length === pagination.limit
        },
        messagePagination: {
          ...state.messagePagination,
          [groupId]: newPagination
        },
        isLoadingMessages: false,
        userCache
      }));
    } catch (error) {
      set({ 
        isLoadingMessages: false,
        errors: { ...get().errors, messages: 'Failed to fetch messages' }
      });
      throw error;
    }
  },

  fetchMoreMessages: async (groupId: string) => {
    const { hasMoreMessages, messagePagination, isLoadingMessages } = get();
    
    if (!hasMoreMessages[groupId] || isLoadingMessages) return;

    const pagination = messagePagination[groupId];
    if (!pagination) return;

    set({ isLoadingMessages: true });
    
    try {
      const response = await api.get(
        `${API_PATHS.chats.messages(groupId)}?limit=${pagination.limit}&offset=${pagination.offset + pagination.limit}`
      );

      const { messages: rawMessages, pagination: newPagination } = response.data;
      const messages = rawMessages || []; // Convert null to empty array

      // Update user cache
      const userCache = { ...get().userCache };
      messages.forEach((msg: ChatMessage) => {
        userCache[msg.user.id] = msg.user;
      });

      set(state => ({
        messagesByGroupId: {
          ...state.messagesByGroupId,
          [groupId]: [...(state.messagesByGroupId[groupId] || []), ...messages]
        },
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [groupId]: messages.length === pagination.limit
        },
        messagePagination: {
          ...state.messagePagination,
          [groupId]: newPagination
        },
        isLoadingMessages: false,
        userCache
      }));
    } catch (error) {
      set({ 
        isLoadingMessages: false,
        errors: { ...get().errors, messages: 'Failed to fetch more messages' }
      });
      throw error;
    }
  },

  fetchGroupMembers: async (groupId: string) => {
    set({
      isLoadingMembers: true,
      errors: { ...get().errors, members: null }
    });

    try {
      const response = await api.get(API_PATHS.chats.members(groupId));
      const rawUsers = response.data;
      
      // Only warn if the response is null or undefined, not if it's an array
      if (rawUsers === null || rawUsers === undefined) {
        logger.warn('[ChatStore] Members API returned null/undefined instead of empty array:', {
          groupId,
          response: response.data
        });
      }
      const users = Array.isArray(rawUsers) ? rawUsers : [];

      // Update user cache
      const userCache = { ...get().userCache };
      users.forEach((user: ChatUser) => {
        userCache[user.id] = user;
      });

      set(state => ({
        membersByGroupId: {
          ...state.membersByGroupId,
          [groupId]: users
        },
        isLoadingMembers: false,
        userCache
      }));
    } catch (error) {
      set({ 
        isLoadingMembers: false,
        errors: { ...get().errors, members: 'Failed to fetch members' }
      });
      throw error;
    }
  },

  sendMessage: async (groupId: string, content: string) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User not authenticated');

    // Create optimistic message
    const optimisticMessage: MessageWithStatus = {
      message: {
        id: `temp-${Date.now()}`,
        group_id: groupId,
        user_id: user.id,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_edited: false,
        is_deleted: false
      },
      user: get().userCache[user.id] || {
        id: user.id,
        email: user.email || '',
        username: user.username || '',
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        profilePicture: user.profilePicture || null
      },
      status: 'sending'
    };

    // Add optimistic message to state
    set(state => ({
      messagesByGroupId: {
        ...state.messagesByGroupId,
        [groupId]: [optimisticMessage, ...(state.messagesByGroupId[groupId] || [])]
      }
    }));

    try {
      // Get the WebSocket manager instance
      const { WebSocketManager } = require('@/src/websocket/WebSocketManager');
      const wsManager = WebSocketManager.getInstance();
      
      // Check if WebSocket is connected
      if (!wsManager.isConnected()) {
        logger.warn('[ChatStore] WebSocket not connected, attempting to connect');
        // Try to connect to the WebSocket
        const tripId = get().groups.find(g => g.id === groupId)?.trip_id;
        if (!tripId) {
          throw new Error('Cannot find trip ID for this chat group');
        }
        await wsManager.connect(tripId);
      }
      
      // Send the message via WebSocket
      const success = wsManager.send('CHAT_MESSAGE_SEND', {
        groupId,
        content,
        messageId: optimisticMessage.message.id
      });
      
      if (!success) {
        throw new Error('Failed to send message via WebSocket');
      }
      
      // Update the message status to 'sent'
      set(state => ({
        messagesByGroupId: {
          ...state.messagesByGroupId,
          [groupId]: state.messagesByGroupId[groupId]?.map(msg => 
            msg.message.id === optimisticMessage.message.id 
              ? { ...msg, status: 'sent' as MessageStatus }
              : msg
          ) || []
        }
      }));
      
      // Note: The actual message with server-generated ID will be received via WebSocket
      // and handled by the handleChatEvent function
      
    } catch (error) {
      logger.error('[ChatStore] Failed to send message:', error);
      // Mark message as failed
      set(state => ({
        messagesByGroupId: {
          ...state.messagesByGroupId,
          [groupId]: state.messagesByGroupId[groupId]?.map(msg => 
            msg.message.id === optimisticMessage.message.id 
              ? { ...msg, status: 'error' as MessageStatus }
              : msg
          ) || []
        }
      }));
      throw error;
    }
  },

  markAsRead: async (groupId: string, messageId: string) => {
    try {
      // Check if messageId is valid before making the API call
      if (!messageId) {
        logger.warn('[ChatStore] Attempted to mark messages as read with invalid messageId:', { groupId, messageId });
        return;
      }
      
      // Skip API call for temporary message IDs but still update local state
      if (messageId.startsWith('temp-')) {
        logger.debug('[ChatStore] Skipping mark as read API call for temporary message ID:', messageId);
        // Update local unread count
        set(state => ({
          groups: state.groups.map(group =>
            group.id === groupId ? { ...group, unreadCount: 0 } : group
          )
        }));
        return;
      }
      
      await api.put(API_PATHS.chats.read(groupId), { message_id: messageId });
      
      // Update local unread count
      set(state => ({
        groups: state.groups.map(group =>
          group.id === groupId ? { ...group, unreadCount: 0 } : group
        )
      }));
    } catch (error) {
      logger.error('[Failed to mark messages as read:]', error);
    }
  },

  handleChatEvent: (event: ServerEvent) => {
    if (!event || !event.type) {
      logger.warn('[ChatStore] Received invalid WebSocket event:', { event });
      return;
    }

    logger.debug('[ChatStore] Handling chat event:', { type: event.type });
    logger.debug('[ChatStore] Event payload:', JSON.stringify(event.payload, null, 2));

    switch (event.type) {
      case 'CHAT_MESSAGE_SENT': {
        const payload = event.payload as {
          messageId: string;
          groupId: string;
          content: string;
          user: {
            id: string;
            name: string;
            avatar?: string;
          };
          timestamp: string;
        };
        
        // Log the payload to debug
        logger.debug('[ChatStore] CHAT_MESSAGE_SENT payload:', JSON.stringify(payload, null, 2));
        
        if (!payload?.groupId || !payload?.messageId) {
          logger.warn('[ChatStore] Received CHAT_MESSAGE_SENT event with invalid payload:', { payload });
          return;
        }

        // Check if user object exists
        if (!payload.user) {
          logger.error('[ChatStore] Missing user object in CHAT_MESSAGE_SENT payload');
          return;
        }

        // Check if user.id exists
        if (!payload.user.id) {
          logger.error('[ChatStore] Missing user.id in CHAT_MESSAGE_SENT payload');
          return;
        }

        // Format the message to match our expected structure
        const message: ChatMessage = {
          message: {
            id: payload.messageId,
            group_id: payload.groupId,
            user_id: payload.user.id,
            content: payload.content,
            created_at: payload.timestamp,
            updated_at: payload.timestamp,
            is_edited: false,
            is_deleted: false
          },
          user: {
            id: payload.user.id,
            email: '', // We don't have this from the event
            username: payload.user.name,
            firstName: null,
            lastName: null,
            profilePicture: payload.user.avatar || null
          }
        };

        // Log the formatted message
        logger.debug('[ChatStore] Formatted message:', JSON.stringify(message, null, 2));

        // Check if this is a message we sent (replace our optimistic message)
        const messages = get().messagesByGroupId[payload.groupId] || [];
        logger.debug('[ChatStore] Existing messages count:', messages.length);
        const isOurMessage = messages.some(msg => 
          msg.status === 'sending' || msg.status === 'sent'
        );

        set(state => {
          // If it's our message, replace the optimistic one
          if (isOurMessage) {
            return {
              messagesByGroupId: {
                ...state.messagesByGroupId,
                [payload.groupId]: messages.map(msg => 
                  (msg.status === 'sending' || msg.status === 'sent') ? message : msg
                )
              },
              userCache: {
                ...state.userCache,
                [payload.user.id]: message.user
              }
            };
          } 
          // Otherwise, add it as a new message
          else {
            return {
              messagesByGroupId: {
                ...state.messagesByGroupId,
                [payload.groupId]: [
                  message,
                  ...(state.messagesByGroupId[payload.groupId] || [])
                ]
              },
              userCache: {
                ...state.userCache,
                [payload.user.id]: message.user
              }
            };
          }
        });
        break;
      }
      
      case 'CHAT_MESSAGE_EDITED': {
        const payload = event.payload as {
          messageId: string;
          groupId: string;
          content: string;
          user?: {
            id: string;
            name: string;
            avatar?: string;
          };
          timestamp?: string;
        };
        
        if (!payload?.groupId || !payload?.messageId) {
          logger.warn('[ChatStore] Received CHAT_MESSAGE_EDITED event with invalid payload:', { payload });
          return;
        }

        set(state => {
          const messages = state.messagesByGroupId[payload.groupId] || [];
          const updatedMessages = messages.map(msg => {
            if (msg.message.id === payload.messageId) {
              return {
                ...msg,
                message: {
                  ...msg.message,
                  content: payload.content,
                  updated_at: payload.timestamp || new Date().toISOString(),
                  is_edited: true
                }
              };
            }
            return msg;
          });

          return {
            messagesByGroupId: {
              ...state.messagesByGroupId,
              [payload.groupId]: updatedMessages
            }
          };
        });
        break;
      }
      
      case 'CHAT_MESSAGE_DELETED': {
        const payload = event.payload as {
          messageId: string;
          groupId: string;
        };
        
        if (!payload?.groupId || !payload?.messageId) {
          logger.warn('[ChatStore] Received CHAT_MESSAGE_DELETED event with invalid payload:', { payload });
          return;
        }

        set(state => ({
          messagesByGroupId: {
            ...state.messagesByGroupId,
            [payload.groupId]: (state.messagesByGroupId[payload.groupId] || [])
              .filter(msg => msg.message.id !== payload.messageId)
          }
        }));
        break;
      }
      
      case 'CHAT_TYPING_STATUS': {
        const payload = event.payload as {
          groupId: string;
          isTyping: boolean;
          user: {
            id: string;
            name: string;
            avatar?: string;
          };
        };
        
        if (!payload?.groupId || !payload?.user?.id) {
          logger.warn('[ChatStore] Received CHAT_TYPING_STATUS event with invalid payload:', { payload });
          return;
        }

        const { user, groupId, isTyping } = payload;
        
        set(state => {
          const currentTypingUsers = state.typingUsers[groupId] || [];
          
          if (isTyping) {
            // Add user to typing list if not already there
            if (!currentTypingUsers.some(u => u.userId === user.id)) {
              return {
                typingUsers: {
                  ...state.typingUsers,
                  [groupId]: [
                    ...currentTypingUsers,
                    { userId: user.id, name: user.name, timestamp: Date.now() }
                  ]
                }
              };
            }
            
            // Update timestamp for existing typing user
            return {
              typingUsers: {
                ...state.typingUsers,
                [groupId]: currentTypingUsers.map(u => 
                  u.userId === user.id ? { ...u, timestamp: Date.now() } : u
                )
              }
            };
          } else {
            // Remove user from typing list
            return {
              typingUsers: {
                ...state.typingUsers,
                [groupId]: currentTypingUsers.filter(u => u.userId !== user.id)
              }
            };
          }
        });
        break;
      }
      
      // Handle legacy event types for backward compatibility
      case 'chat_message_created': {
        const { data: message } = event as any;
        if (!message?.message?.group_id) {
          logger.warn('[ChatStore] Received chat_message_created event with invalid message data:', { message });
          return;
        }

        set(state => ({
          messagesByGroupId: {
            ...state.messagesByGroupId,
            [message.message.group_id]: [
              message,
              ...(state.messagesByGroupId[message.message.group_id] || [])
            ]
          },
          userCache: message.user ? {
            ...state.userCache,
            [message.user.id]: message.user
          } : state.userCache
        }));
        break;
      }
      
      case 'chat_message_updated': {
        const { data: message } = event as any;
        if (!message?.message?.group_id) {
          logger.warn('[ChatStore] Received chat_message_updated event with invalid message data:', { message });
          return;
        }

        set(state => ({
          messagesByGroupId: {
            ...state.messagesByGroupId,
            [message.message.group_id]: (state.messagesByGroupId[message.message.group_id] || [])
              .map(msg => msg.message.id === message.message.id ? message : msg)
          }
        }));
        break;
      }
      
      case 'chat_message_deleted': {
        const { data } = event as any;
        if (!data?.group_id || !data?.id) {
          logger.warn('[ChatStore] Received chat_message_deleted event with invalid data:', { data });
          return;
        }

        set(state => ({
          messagesByGroupId: {
            ...state.messagesByGroupId,
            [data.group_id]: (state.messagesByGroupId[data.group_id] || [])
              .filter(msg => msg.message.id !== data.id)
          }
        }));
        break;
      }
      
      case 'chat_typing_status': {
        const { data } = event as any;
        if (!data?.group_id || !data?.user_id) {
          logger.warn('[ChatStore] Received chat_typing_status event with invalid data:', { data });
          return;
        }

        const { user_id, group_id, is_typing, username } = data;
        
        set(state => {
          const currentTypingUsers = state.typingUsers[group_id] || [];
          
          if (is_typing) {
            // Add user to typing list if not already there
            if (!currentTypingUsers.some(u => u.userId === user_id)) {
              return {
                typingUsers: {
                  ...state.typingUsers,
                  [group_id]: [
                    ...currentTypingUsers,
                    { userId: user_id, name: username, timestamp: Date.now() }
                  ]
                }
              };
            }
            
            // Update timestamp for existing typing user
            return {
              typingUsers: {
                ...state.typingUsers,
                [group_id]: currentTypingUsers.map(u => 
                  u.userId === user_id ? { ...u, timestamp: Date.now() } : u
                )
              }
            };
          } else {
            // Remove user from typing list
            return {
              typingUsers: {
                ...state.typingUsers,
                [group_id]: currentTypingUsers.filter(u => u.userId !== user_id)
              }
            };
          }
        });
        break;
      }
      
      default:
        logger.debug('[ChatStore] Unhandled chat event type:', event.type);
    }
  },

  /**
   * Set the typing status for the current user in a chat group
   */
  setTypingStatus: async (groupId: string, isTyping: boolean) => {
    if (!groupId) return;
    
    try {
      // Get the current user
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;
      
      // Use the WebSocket manager to send typing status
      const wsManager = WebSocketManager.getInstance();
      await wsManager.sendTypingStatus(groupId, isTyping);
      
      // Note: We don't update local state here because the WebSocket
      // will broadcast the typing status to all users including the sender,
      // and we'll handle it in the WebSocket event handler
    } catch (error) {
      logger.error('ChatStore', 'Failed to set typing status:', error);
    }
  }
})); 