import { z } from 'zod';

// Chat Group Types
export interface ChatGroup {
  id: string;
  name: string;
  tripId: string;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  lastMessageAt?: string;
  lastMessage?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
    };
    createdAt: string;
  };
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  attachments?: ChatAttachment[];
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'file' | 'location';
  url: string;
  thumbnailUrl?: string;
  name?: string;
  size?: number;
  metadata?: Record<string, any>;
}

export interface ChatMember {
  userId: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  lastReadMessageId?: string;
  lastReadAt?: string;
}

// Request/Response Types
export interface GetChatGroupsResponse {
  groups: ChatGroup[];
}

export interface GetChatMessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface GetChatMembersResponse {
  members: ChatMember[];
}

export interface SendMessageRequest {
  content: string;
  attachments?: {
    type: 'image' | 'file' | 'location';
    url?: string;
    metadata?: Record<string, any>;
  }[];
}

export interface SendMessageResponse {
  message: ChatMessage;
}

export interface UpdateLastReadRequest {
  messageId: string;
}

export interface UpdateLastReadResponse {
  success: boolean;
  lastReadAt: string;
}

export interface UpdateChatGroupRequest {
  name?: string;
}

export interface UpdateChatGroupResponse {
  group: ChatGroup;
}

// WebSocket Event Types
export const ChatEventType = z.enum([
  'MESSAGE_SENT',
  'MESSAGE_DELIVERED',
  'MESSAGE_READ',
  'GROUP_UPDATED',
  'GROUP_DELETED',
  'MEMBER_JOINED',
  'MEMBER_LEFT',
  'TYPING_STARTED',
  'TYPING_STOPPED'
]);

export type ChatEventType = z.infer<typeof ChatEventType>;

export const ChatEventSchema = z.object({
  id: z.string(),
  type: ChatEventType,
  groupId: z.string(),
  userId: z.string().optional(),
  timestamp: z.string().datetime(),
  payload: z.unknown()
});

export type ChatEvent = z.infer<typeof ChatEventSchema>;

// Type guards
export const isChatEvent = (event: unknown): event is ChatEvent => {
  return ChatEventSchema.safeParse(event).success;
};

export const isMessageEvent = (event: ChatEvent): boolean => {
  return ['MESSAGE_SENT', 'MESSAGE_DELIVERED', 'MESSAGE_READ'].includes(event.type);
};

export const isTypingEvent = (event: ChatEvent): boolean => {
  return ['TYPING_STARTED', 'TYPING_STOPPED'].includes(event.type);
}; 