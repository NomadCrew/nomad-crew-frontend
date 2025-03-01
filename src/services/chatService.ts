import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import {
  ChatGroup,
  ChatMessage,
  ChatMember,
  GetChatGroupsResponse,
  GetChatMessagesResponse,
  GetChatMembersResponse,
  SendMessageRequest,
  SendMessageResponse,
  UpdateLastReadRequest,
  UpdateLastReadResponse,
  UpdateChatGroupRequest,
  UpdateChatGroupResponse
} from '@/src/types/chat';

/**
 * Service for handling chat-related API calls
 */
export const chatService = {
  /**
   * Get all chat groups for the current user
   * @param tripId Optional trip ID to filter chat groups by trip
   */
  async getChatGroups(tripId?: string): Promise<ChatGroup[]> {
    // Add query parameters if tripId is provided
    const params = new URLSearchParams();
    if (tripId) {
      params.append('tripID', tripId);
    }
    
    const url = tripId 
      ? `${API_PATHS.chats.groups}?${params.toString()}`
      : API_PATHS.chats.groups;
      
    const response = await api.get<GetChatGroupsResponse>(url);
    return response.data.groups;
  },

  /**
   * Get messages for a specific chat group
   * @param groupId The ID of the chat group
   * @param limit The maximum number of messages to retrieve
   * @param cursor Pagination cursor for fetching more messages
   */
  async getChatMessages(
    groupId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<GetChatMessagesResponse> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (cursor) {
      params.append('cursor', cursor);
    }

    const response = await api.get<GetChatMessagesResponse>(
      `${API_PATHS.chats.messages(groupId)}?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get members of a specific chat group
   * @param groupId The ID of the chat group
   */
  async getChatMembers(groupId: string): Promise<ChatMember[]> {
    const response = await api.get<GetChatMembersResponse>(API_PATHS.chats.members(groupId));
    return response.data.members;
  },

  /**
   * Send a message to a chat group
   * @param groupId The ID of the chat group
   * @param message The message to send
   */
  async sendMessage(groupId: string, message: SendMessageRequest): Promise<ChatMessage> {
    const response = await api.post<SendMessageResponse>(
      API_PATHS.chats.messages(groupId),
      message
    );
    return response.data.message;
  },

  /**
   * Update the last read message for a chat group
   * @param groupId The ID of the chat group
   * @param data The update data containing the message ID
   */
  async updateLastRead(groupId: string, data: UpdateLastReadRequest): Promise<UpdateLastReadResponse> {
    const response = await api.put<UpdateLastReadResponse>(
      API_PATHS.chats.read(groupId),
      data
    );
    return response.data;
  },

  /**
   * Update a chat group's details
   * @param groupId The ID of the chat group
   * @param data The update data
   */
  async updateChatGroup(groupId: string, data: UpdateChatGroupRequest): Promise<ChatGroup> {
    const response = await api.put<UpdateChatGroupResponse>(
      API_PATHS.chats.groupById(groupId),
      data
    );
    return response.data.group;
  },

  /**
   * Delete a chat group
   * @param groupId The ID of the chat group
   */
  async deleteChatGroup(groupId: string): Promise<boolean> {
    await api.delete(API_PATHS.chats.groupById(groupId));
    return true;
  },

  /**
   * Get the WebSocket URL for a chat group
   * @param groupId The ID of the chat group
   */
  getChatWebSocketUrl(groupId: string): string {
    return API_PATHS.chats.ws(groupId);
  }
}; 