import { create } from 'zustand';
import { ChatGroup, ChatMessage, ChatMember, ChatEvent } from '@/src/types/chat';
import { chatService } from '@/src/services/chatService';
import { logger } from '@/src/utils/logger';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useTripStore } from '@/src/store/useTripStore';

interface ChatState {
  // Chat groups
  groups: ChatGroup[];
  selectedGroupId: string | null;
  isLoadingGroups: boolean;
  
  // Messages
  messagesByGroupId: Record<string, ChatMessage[]>;
  isLoadingMessages: boolean;
  hasMoreMessages: Record<string, boolean>;
  messageCursors: Record<string, string | undefined>;
  
  // Members
  membersByGroupId: Record<string, ChatMember[]>;
  isLoadingMembers: boolean;
  
  // Typing indicators
  typingUsers: Record<string, { userId: string; name: string; timestamp: number }[]>;
  
  // Actions
  fetchChatGroups: () => Promise<void>;
  selectChatGroup: (groupId: string) => void;
  fetchMessages: (groupId: string, refresh?: boolean) => Promise<void>;
  fetchMoreMessages: (groupId: string) => Promise<void>;
  fetchMembers: (groupId: string) => Promise<void>;
  sendMessage: (groupId: string, content: string) => Promise<void>;
  markAsRead: (groupId: string, messageId: string) => Promise<void>;
  handleChatEvent: (event: ChatEvent) => void;
  setTypingStatus: (groupId: string, isTyping: boolean) => void;
  updateChatGroup: (groupId: string, name: string) => Promise<void>;
  deleteChatGroup: (groupId: string) => Promise<void>;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  groups: [],
  selectedGroupId: null,
  isLoadingGroups: false,
  messagesByGroupId: {},
  isLoadingMessages: false,
  hasMoreMessages: {},
  messageCursors: {},
  membersByGroupId: {},
  isLoadingMembers: false,
  typingUsers: {},
  
  // Actions
  fetchChatGroups: async () => {
    try {
      set({ isLoadingGroups: true });
      
      // Check authentication status before making the request
      const authStore = useAuthStore.getState();
      
      // Wait for auth store to be initialized
      if (!authStore.isInitialized) {
        logger.debug('Chat Store', 'Waiting for auth store to initialize');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Get the current trip ID from the trip store if available
      const tripStore = useTripStore.getState();
      const currentTripId = tripStore?.selectedTrip?.id;
      
      logger.debug('Chat Store', 'Fetching chat groups', { 
        tripId: currentTripId || 'none' 
      });
      
      // The API client will handle token refresh automatically if needed
      // We don't need to manually check for token validity here anymore
      
      // Now proceed with the API call, passing the trip ID if available
      const groups = await chatService.getChatGroups(currentTripId);
      set({ groups, isLoadingGroups: false });
    } catch (error: any) {
      logger.error('Chat Store', 'Failed to fetch chat groups:', error);
      
      // If the error is related to authentication, we don't need to handle it here
      // The API client will handle token refresh and logout if needed
      
      set({ isLoadingGroups: false });
    }
  },
  
  selectChatGroup: (groupId: string) => {
    set({ selectedGroupId: groupId });
    
    // If we don't have messages for this group yet, fetch them
    const { messagesByGroupId, fetchMessages } = get();
    if (!messagesByGroupId[groupId]) {
      fetchMessages(groupId);
    }
    
    // If we don't have members for this group yet, fetch them
    const { membersByGroupId, fetchMembers } = get();
    if (!membersByGroupId[groupId]) {
      fetchMembers(groupId);
    }
  },
  
  fetchMessages: async (groupId: string, refresh = false) => {
    try {
      set({ isLoadingMessages: true });
      
      const response = await chatService.getChatMessages(groupId);
      
      set(state => ({
        messagesByGroupId: {
          ...state.messagesByGroupId,
          [groupId]: refresh ? response.messages : response.messages
        },
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [groupId]: response.hasMore
        },
        messageCursors: {
          ...state.messageCursors,
          [groupId]: response.nextCursor
        },
        isLoadingMessages: false
      }));
    } catch (error) {
      logger.error('Chat Store', 'Failed to fetch messages:', error);
      set({ isLoadingMessages: false });
    }
  },
  
  fetchMoreMessages: async (groupId: string) => {
    const { hasMoreMessages, messageCursors, isLoadingMessages, messagesByGroupId } = get();
    
    if (!hasMoreMessages[groupId] || isLoadingMessages || !messageCursors[groupId]) {
      return;
    }
    
    try {
      set({ isLoadingMessages: true });
      
      const response = await chatService.getChatMessages(
        groupId,
        20,
        messageCursors[groupId]
      );
      
      set(state => ({
        messagesByGroupId: {
          ...state.messagesByGroupId,
          [groupId]: [...(state.messagesByGroupId[groupId] || []), ...response.messages]
        },
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [groupId]: response.hasMore
        },
        messageCursors: {
          ...state.messageCursors,
          [groupId]: response.nextCursor
        },
        isLoadingMessages: false
      }));
    } catch (error) {
      logger.error('Chat Store', 'Failed to fetch more messages:', error);
      set({ isLoadingMessages: false });
    }
  },
  
  fetchMembers: async (groupId: string) => {
    try {
      set({ isLoadingMembers: true });
      
      const members = await chatService.getChatMembers(groupId);
      
      set(state => ({
        membersByGroupId: {
          ...state.membersByGroupId,
          [groupId]: members
        },
        isLoadingMembers: false
      }));
    } catch (error) {
      logger.error('Chat Store', 'Failed to fetch members:', error);
      set({ isLoadingMembers: false });
    }
  },
  
  sendMessage: async (groupId: string, content: string) => {
    try {
      const message = await chatService.sendMessage(groupId, { content });
      
      // Optimistically add the message to the UI
      set(state => ({
        messagesByGroupId: {
          ...state.messagesByGroupId,
          [groupId]: [message, ...(state.messagesByGroupId[groupId] || [])]
        }
      }));
      
      // Update the last message in the group
      set(state => ({
        groups: state.groups.map(group => 
          group.id === groupId
            ? {
                ...group,
                lastMessage: {
                  id: message.id,
                  content: message.content,
                  sender: message.sender,
                  createdAt: message.createdAt
                },
                lastMessageAt: message.createdAt,
                unreadCount: 0 // Reset unread count for sender
              }
            : group
        )
      }));
    } catch (error) {
      logger.error('Chat Store', 'Failed to send message:', error);
    }
  },
  
  markAsRead: async (groupId: string, messageId: string) => {
    try {
      await chatService.updateLastRead(groupId, { messageId });
      
      // Update the unread count for this group
      set(state => ({
        groups: state.groups.map(group => 
          group.id === groupId
            ? { ...group, unreadCount: 0 }
            : group
        )
      }));
    } catch (error) {
      logger.error('Chat Store', 'Failed to mark as read:', error);
    }
  },
  
  handleChatEvent: (event: ChatEvent) => {
    const { type, groupId, userId, payload } = event;
    
    switch (type) {
      case 'MESSAGE_SENT':
        if (payload && typeof payload === 'object' && 'message' in payload) {
          const message = payload.message as ChatMessage;
          
          // Add the message to the messages list
          set(state => ({
            messagesByGroupId: {
              ...state.messagesByGroupId,
              [groupId]: [message, ...(state.messagesByGroupId[groupId] || [])]
            },
            // Update the group's last message
            groups: state.groups.map(group => 
              group.id === groupId
                ? {
                    ...group,
                    lastMessage: {
                      id: message.id,
                      content: message.content,
                      sender: message.sender,
                      createdAt: message.createdAt
                    },
                    lastMessageAt: message.createdAt,
                    // Increment unread count if this is not the selected group
                    unreadCount: state.selectedGroupId === groupId 
                      ? 0 
                      : (group.unreadCount || 0) + 1
                  }
                : group
            )
          }));
        }
        break;
        
      case 'MESSAGE_READ':
        // Update read status for messages
        if (payload && typeof payload === 'object' && 'messageId' in payload && 'userId' in payload) {
          const { messageId, userId } = payload as { messageId: string; userId: string };
          
          // Update the member's last read message
          set(state => ({
            membersByGroupId: {
              ...state.membersByGroupId,
              [groupId]: (state.membersByGroupId[groupId] || []).map(member => 
                member.userId === userId
                  ? { ...member, lastReadMessageId: messageId, lastReadAt: new Date().toISOString() }
                  : member
              )
            }
          }));
        }
        break;
        
      case 'TYPING_STARTED':
        if (payload && typeof payload === 'object' && 'userId' in payload && 'name' in payload) {
          const { userId, name } = payload as { userId: string; name: string };
          
          set(state => {
            const groupTypingUsers = state.typingUsers[groupId] || [];
            const userIndex = groupTypingUsers.findIndex(u => u.userId === userId);
            
            if (userIndex === -1) {
              // Add the user to typing users
              return {
                typingUsers: {
                  ...state.typingUsers,
                  [groupId]: [
                    ...groupTypingUsers,
                    { userId, name, timestamp: Date.now() }
                  ]
                }
              };
            } else {
              // Update the timestamp
              const updatedUsers = [...groupTypingUsers];
              updatedUsers[userIndex] = { userId, name, timestamp: Date.now() };
              
              return {
                typingUsers: {
                  ...state.typingUsers,
                  [groupId]: updatedUsers
                }
              };
            }
          });
        }
        break;
        
      case 'TYPING_STOPPED':
        if (payload && typeof payload === 'object' && 'userId' in payload) {
          const { userId } = payload as { userId: string };
          
          set(state => {
            const groupTypingUsers = state.typingUsers[groupId] || [];
            const updatedUsers = groupTypingUsers.filter(u => u.userId !== userId);
            
            return {
              typingUsers: {
                ...state.typingUsers,
                [groupId]: updatedUsers
              }
            };
          });
        }
        break;
        
      case 'GROUP_UPDATED':
        if (payload && typeof payload === 'object' && 'group' in payload) {
          const updatedGroup = payload.group as ChatGroup;
          
          set(state => ({
            groups: state.groups.map(group => 
              group.id === updatedGroup.id ? updatedGroup : group
            )
          }));
        }
        break;
        
      case 'GROUP_DELETED':
        if (payload && typeof payload === 'object' && 'groupId' in payload) {
          const deletedGroupId = payload.groupId as string;
          
          set(state => ({
            groups: state.groups.filter(group => group.id !== deletedGroupId),
            selectedGroupId: state.selectedGroupId === deletedGroupId ? null : state.selectedGroupId
          }));
        }
        break;
        
      case 'MEMBER_JOINED':
      case 'MEMBER_LEFT':
        // Refresh members list
        if (get().membersByGroupId[groupId]) {
          get().fetchMembers(groupId);
        }
        break;
    }
  },
  
  setTypingStatus: (groupId: string, isTyping: boolean) => {
    // This would typically send a WebSocket message to the server
    // Implementation depends on the WebSocket setup
    logger.debug('Chat Store', `Setting typing status for group ${groupId} to ${isTyping}`);
  },
  
  updateChatGroup: async (groupId: string, name: string) => {
    try {
      const updatedGroup = await chatService.updateChatGroup(groupId, { name });
      
      set(state => ({
        groups: state.groups.map(group => 
          group.id === groupId ? updatedGroup : group
        )
      }));
    } catch (error) {
      logger.error('Chat Store', 'Failed to update chat group:', error);
    }
  },
  
  deleteChatGroup: async (groupId: string) => {
    try {
      await chatService.deleteChatGroup(groupId);
      
      set(state => ({
        groups: state.groups.filter(group => group.id !== groupId),
        selectedGroupId: state.selectedGroupId === groupId ? null : state.selectedGroupId
      }));
    } catch (error) {
      logger.error('Chat Store', 'Failed to delete chat group:', error);
    }
  },
  
  reset: () => {
    set({
      groups: [],
      selectedGroupId: null,
      messagesByGroupId: {},
      hasMoreMessages: {},
      messageCursors: {},
      membersByGroupId: {},
      typingUsers: {}
    });
  }
})); 