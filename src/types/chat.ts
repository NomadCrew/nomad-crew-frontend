import { z } from 'zod';

// API Response Types
export interface ChatGroupResponse {
  id: string;
  trip_id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChatUser {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
}

export interface ChatMessage {
  message: {
    id: string;
    group_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    is_edited: boolean;
    is_deleted: boolean;
  };
  user: ChatUser;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  pagination: PaginationInfo;
}

export interface ChatMembersResponse {
  users: ChatUser[];
}

// WebSocket Event Types
export type ChatWebSocketEvent = 
  | { type: 'chat_message_created'; data: ChatMessage }
  | { type: 'chat_message_updated'; data: ChatMessage }
  | { type: 'chat_message_deleted'; data: { id: string; group_id: string } }
  | { type: 'chat_typing_status'; data: { user_id: string; group_id: string; is_typing: boolean; username: string } };

// Request Types
export interface CreateChatGroupRequest {
  trip_id: string;
  name: string;
  description: string;
}

export interface UpdateReadStatusRequest {
  message_id: string;
}

// Local State Types
export interface ChatGroup extends ChatGroupResponse {
  unreadCount?: number;
  lastMessage?: ChatMessage;
}

export interface ChatState {
  // Chat groups
  groups: ChatGroup[];
  selectedGroupId: string | null;
  isLoadingGroups: boolean;
  
  // Messages
  messagesByGroupId: Record<string, ChatMessage[]>;
  isLoadingMessages: boolean;
  hasMoreMessages: Record<string, boolean>;
  messagePagination: Record<string, PaginationInfo>;
  
  // Members
  membersByGroupId: Record<string, ChatUser[]>;
  isLoadingMembers: boolean;
  
  // Typing indicators
  typingUsers: Record<string, { userId: string; name: string; timestamp: number }[]>;
  
  // Error states
  errors: Record<string, string | null>;
  
  // Cache
  userCache: Record<string, ChatUser>;
}

// Message Status
export type MessageStatus = 'sending' | 'sent' | 'error';
export interface MessageWithStatus extends ChatMessage {
  status?: MessageStatus;
  retryCount?: number;
} 