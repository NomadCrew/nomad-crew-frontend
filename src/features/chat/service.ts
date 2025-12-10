import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import {
  ChatMessage,
  GetChatMessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
  UpdateLastReadRequest,
  UpdateLastReadResponse
} from './types';

/**
 * Service for handling chat-related API calls
 */
export const chatService = {
  /**
   * Get messages for a specific trip
   * @param tripId The ID of the trip
   * @param limit The maximum number of messages to retrieve
   * @param cursor Pagination cursor for fetching more messages
   */
  async getChatMessages(
    tripId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<GetChatMessagesResponse> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (cursor) {
      params.append('cursor', cursor);
    }

    const response = await api.get<GetChatMessagesResponse>(
      `${API_PATHS.trips.messages(tripId)}?${params.toString()}`
    );
    
    // Ensure we always have a valid response structure
    const data = response.data || {};
    const messages = data.messages || [];
    const pagination = data.pagination || { has_more: false };
    
    // Log for debugging backend response structure  
    console.log('Chat Service Response:', {
      messagesCount: messages.length,
      hasPagination: !!data.pagination,
      paginationStructure: data.pagination,
      rawResponse: response.data
    });
    
    return {
      messages,
      pagination: {
        has_more: pagination.has_more || false,
        next_cursor: pagination.next_cursor
      }
    };
  },

  /**
   * Send a message to a trip chat
   * @param tripId The ID of the trip
   * @param message The message to send
   */
  async sendMessage(tripId: string, message: SendMessageRequest): Promise<ChatMessage> {
    const response = await api.post<SendMessageResponse>(
      API_PATHS.trips.messages(tripId),
      message
    );
    return response.data.message;
  },

  /**
   * Update the last read message for a trip
   * @param tripId The ID of the trip
   * @param data The update data containing the message ID
   */
  async updateLastRead(tripId: string, data: UpdateLastReadRequest): Promise<UpdateLastReadResponse> {
    const response = await api.put<UpdateLastReadResponse>(
      API_PATHS.trips.messagesRead(tripId),
      data
    );
    return response.data;
  }
}; 