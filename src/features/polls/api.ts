import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import type { PollResponse, CreatePollInput, PollsResponse } from './types';

/**
 * Poll API Service Layer
 *
 * Handles all API calls related to polls, separated from state management.
 * All functions return typed responses directly from the API.
 */
export const pollApi = {
  /**
   * Fetch all polls for a specific trip with pagination
   */
  getAll: async (
    tripId: string,
    offset: number = 0,
    limit: number = 20
  ): Promise<PollsResponse> => {
    const response = await api.get<PollsResponse>(
      `${API_PATHS.polls.list(tripId)}?offset=${offset}&limit=${limit}`
    );
    return response.data;
  },

  /**
   * Fetch a single poll by ID
   */
  getById: async (tripId: string, pollId: string): Promise<PollResponse> => {
    const response = await api.get<PollResponse>(API_PATHS.polls.byId(tripId, pollId));
    return response.data;
  },

  /**
   * Create a new poll
   */
  create: async (tripId: string, input: CreatePollInput): Promise<PollResponse> => {
    const response = await api.post<PollResponse>(API_PATHS.polls.create(tripId), input);
    return response.data;
  },

  /**
   * Cast a vote on a poll option
   */
  vote: async (tripId: string, pollId: string, optionId: string): Promise<void> => {
    await api.post(API_PATHS.polls.vote(tripId, pollId), { optionId });
  },

  /**
   * Remove a vote from a poll option
   */
  removeVote: async (tripId: string, pollId: string, optionId: string): Promise<void> => {
    await api.delete(API_PATHS.polls.removeVote(tripId, pollId, optionId));
  },

  /**
   * Close a poll
   */
  close: async (tripId: string, pollId: string): Promise<void> => {
    await api.post(API_PATHS.polls.close(tripId, pollId));
  },

  /**
   * Soft delete a poll
   */
  deletePoll: async (tripId: string, pollId: string): Promise<void> => {
    await api.delete(API_PATHS.polls.byId(tripId, pollId));
  },
};
