import { z } from 'zod';
import { ServerEvent } from '@/src/types/events';

// API Response Types
export interface ChatMessage {
  id: string;
  trip_id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface GetChatMessagesResponse {
  messages: ChatMessage[];
  pagination: {
    next_cursor?: string;
    has_more: boolean;
  };
}

export interface SendMessageRequest {
  content: string;
  temp_id?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
}

export interface UpdateLastReadRequest {
  message_id: string;
}

export interface UpdateLastReadResponse {
  success: boolean;
}

// Add read receipt types
export interface ReadReceipt {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message_id: string;
  timestamp: string;
}

// WebSocket Event Types
export type ChatWebSocketEvent = 
  | { type: 'chat_message_created'; data: ChatMessage }
  | { type: 'chat_message_updated'; data: ChatMessage }
  | { type: 'chat_message_deleted'; data: { id: string; trip_id: string } }
  | { type: 'chat_typing_status'; data: { user_id: string; trip_id: string; is_typing: boolean; username: string } }
  | { type: 'chat_read_receipt'; data: { user_id: string; trip_id: string; message_id: string; user_name: string; user_avatar?: string; timestamp: string } };

// Client-side Types
export type MessageStatus = 'sending' | 'sent' | 'error';

export interface ChatMessageWithStatus {
  message: ChatMessage;
  status: MessageStatus;
  error?: string;
  readBy?: ReadReceipt[]; // Add readBy property to track who has read the message
}

export interface PaginationInfo {
  nextCursor?: string;
}

export interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface ChatState {
  // Messages
  messagesByTripId: Record<string, ChatMessageWithStatus[]>;
  isLoadingMessages: boolean;
  hasMoreMessages: Record<string, boolean>;
  messagePagination: Record<string, PaginationInfo>;
  
  // Typing indicators
  typingUsers: Record<string, { userId: string; name: string; timestamp: number }[]>;
  
  // Read receipts
  lastReadMessageIds: Record<string, string>; // tripId -> messageId
  readReceipts: Record<string, Record<string, ReadReceipt[]>>; // tripId -> messageId -> ReadReceipt[]
  
  // Error states
  errors: Record<string, string | null>;
  error: string | null;
  
  // Loading states
  isLoading: boolean;
  isSending: boolean;
  
  // Cache
  userCache: Record<string, ChatUser>;
  
  // Actions
  initializeStore: () => Promise<void>;
  connectToChat: (tripId: string) => Promise<void>;
  disconnectFromChat: (tripId: string) => void;
  fetchMessages: (tripId: string, refresh?: boolean) => Promise<void>;
  fetchMoreMessages: (tripId: string) => Promise<void>;
  sendMessage: (params: { tripId: string; content: string }) => Promise<void>;
  markAsRead: (tripId: string, messageId: string) => Promise<void>;
  handleChatEvent: (event: ServerEvent) => void;
  setTypingStatus: (tripId: string, isTyping: boolean) => Promise<void>;
  // New read receipt actions
  updateReadReceipt: (tripId: string, messageId: string, readReceipt: ReadReceipt) => void;
  getReadReceipts: (tripId: string, messageId: string) => ReadReceipt[];
  getLastReadMessageId: (tripId: string) => string | undefined;
} 