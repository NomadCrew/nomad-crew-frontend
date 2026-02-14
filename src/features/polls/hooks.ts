import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pollApi } from './api';
import { pollKeys } from './queries';
import type { PollResponse, PollsResponse, PollOptionWithVotes } from './types';
import { logger } from '@/src/utils/logger';
import { useAuthStore } from '@/src/features/auth/store';

/**
 * Poll TanStack Query Hooks
 *
 * These hooks provide a declarative API for fetching and mutating poll data.
 * They handle caching, background refetching, and optimistic updates automatically.
 */

/**
 * Fetch all polls for a specific trip with pagination
 *
 * @param tripId - Trip ID to fetch polls for
 * @param offset - Pagination offset (default: 0)
 * @param limit - Pagination limit (default: 20)
 */
export const usePolls = (tripId: string, offset: number = 0, limit: number = 20) => {
  return useQuery({
    queryKey: pollKeys.list(tripId, offset, limit),
    queryFn: () => pollApi.getAll(tripId, offset, limit),
    enabled: !!tripId,
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
  });
};

/**
 * Fetch a single poll by ID with full vote data
 *
 * @param tripId - Trip ID the poll belongs to
 * @param pollId - Poll ID to fetch
 */
export const usePoll = (tripId: string, pollId: string) => {
  return useQuery({
    queryKey: pollKeys.detail(pollId),
    queryFn: () => pollApi.getById(tripId, pollId),
    enabled: !!tripId && !!pollId,
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
  });
};

/**
 * Create a new poll
 *
 * Automatically invalidates the polls list cache on success.
 */
export const useCreatePoll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      input,
    }: {
      tripId: string;
      input: Parameters<typeof pollApi.create>[1];
    }) => pollApi.create(tripId, input),
    onSuccess: (newPoll) => {
      logger.info('POLL', 'Poll created successfully:', newPoll.id);
      queryClient.invalidateQueries({ queryKey: pollKeys.lists() });
    },
    onError: (error) => {
      logger.error('POLL', 'Failed to create poll:', error);
    },
  });
};

/**
 * Cast a vote on a poll option
 *
 * Uses optimistic updates to immediately reflect the vote in the UI.
 * For single-choice polls, also decrements the previously voted option.
 */
export const useCastVote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      pollId,
      optionId,
    }: {
      tripId: string;
      pollId: string;
      optionId: string;
    }) => pollApi.vote(tripId, pollId, optionId),
    onMutate: async ({ tripId, pollId, optionId }) => {
      // Cancel outgoing queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: pollKeys.detail(pollId) });
      await queryClient.cancelQueries({ queryKey: pollKeys.lists() });

      const currentUserId = useAuthStore.getState().user?.id;
      const optimisticVoter = { userId: currentUserId ?? '', createdAt: new Date().toISOString() };

      // Snapshot previous data for rollback
      const previousDetail = queryClient.getQueryData<PollResponse>(pollKeys.detail(pollId));
      const previousLists = queryClient.getQueriesData<PollsResponse>({
        queryKey: pollKeys.lists(),
      });

      const applyVoteToOptions = (
        options: PollOptionWithVotes[],
        isMultiChoice: boolean
      ): PollOptionWithVotes[] =>
        options.map((opt) => {
          if (opt.id === optionId) {
            return {
              ...opt,
              voteCount: opt.voteCount + 1,
              hasVoted: true,
              voters: [...opt.voters, optimisticVoter],
            };
          }
          if (!isMultiChoice && opt.hasVoted) {
            return {
              ...opt,
              voteCount: Math.max(0, opt.voteCount - 1),
              hasVoted: false,
              voters: opt.voters.filter((v) => v.userId !== currentUserId),
            };
          }
          return opt;
        });

      // Optimistically update detail cache
      if (previousDetail) {
        const isMultiChoice = previousDetail.allowMultipleVotes;

        queryClient.setQueryData<PollResponse>(pollKeys.detail(pollId), (old) => {
          if (!old) return old;
          return {
            ...old,
            totalVotes: old.totalVotes + (isMultiChoice ? 1 : old.userVoteCount === 0 ? 1 : 0),
            userVoteCount: isMultiChoice ? old.userVoteCount + 1 : 1,
            options: applyVoteToOptions(old.options, isMultiChoice),
          };
        });
      }

      // Optimistically update list caches
      queryClient.setQueriesData<PollsResponse>({ queryKey: pollKeys.lists() }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((poll) => {
            if (poll.id !== pollId) return poll;
            const isMultiChoice = poll.allowMultipleVotes;
            return {
              ...poll,
              totalVotes: poll.totalVotes + (isMultiChoice ? 1 : poll.userVoteCount === 0 ? 1 : 0),
              userVoteCount: isMultiChoice ? poll.userVoteCount + 1 : 1,
              options: applyVoteToOptions(poll.options, isMultiChoice),
            };
          }),
        };
      });

      return { previousDetail, previousLists };
    },
    onError: (error, _variables, context) => {
      logger.error('POLL', 'Failed to cast vote:', error);
      // Rollback optimistic updates
      if (context?.previousDetail) {
        queryClient.setQueryData(
          pollKeys.detail(context.previousDetail.id),
          context.previousDetail
        );
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_data, _error, { pollId }) => {
      queryClient.invalidateQueries({ queryKey: pollKeys.detail(pollId) });
      queryClient.invalidateQueries({ queryKey: pollKeys.lists() });
    },
  });
};

/**
 * Remove a vote from a poll option
 *
 * Uses optimistic updates to immediately decrement the vote count.
 */
export const useRemoveVote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      pollId,
      optionId,
    }: {
      tripId: string;
      pollId: string;
      optionId: string;
    }) => pollApi.removeVote(tripId, pollId, optionId),
    onMutate: async ({ pollId, optionId }) => {
      await queryClient.cancelQueries({ queryKey: pollKeys.detail(pollId) });
      await queryClient.cancelQueries({ queryKey: pollKeys.lists() });

      const currentUserId = useAuthStore.getState().user?.id;
      const previousDetail = queryClient.getQueryData<PollResponse>(pollKeys.detail(pollId));
      const previousLists = queryClient.getQueriesData<PollsResponse>({
        queryKey: pollKeys.lists(),
      });

      const removeVoteFromOptions = (options: PollOptionWithVotes[]): PollOptionWithVotes[] =>
        options.map((opt) => {
          if (opt.id === optionId) {
            return {
              ...opt,
              voteCount: Math.max(0, opt.voteCount - 1),
              hasVoted: false,
              voters: opt.voters.filter((v) => v.userId !== currentUserId),
            };
          }
          return opt;
        });

      // Optimistically update detail cache
      if (previousDetail) {
        queryClient.setQueryData<PollResponse>(pollKeys.detail(pollId), (old) => {
          if (!old) return old;
          return {
            ...old,
            totalVotes: Math.max(0, old.totalVotes - 1),
            userVoteCount: Math.max(0, old.userVoteCount - 1),
            options: removeVoteFromOptions(old.options),
          };
        });
      }

      // Optimistically update list caches
      queryClient.setQueriesData<PollsResponse>({ queryKey: pollKeys.lists() }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((poll) => {
            if (poll.id !== pollId) return poll;
            return {
              ...poll,
              totalVotes: Math.max(0, poll.totalVotes - 1),
              userVoteCount: Math.max(0, poll.userVoteCount - 1),
              options: removeVoteFromOptions(poll.options),
            };
          }),
        };
      });

      return { previousDetail, previousLists };
    },
    onError: (error, _variables, context) => {
      logger.error('POLL', 'Failed to remove vote:', error);
      if (context?.previousDetail) {
        queryClient.setQueryData(
          pollKeys.detail(context.previousDetail.id),
          context.previousDetail
        );
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_data, _error, { pollId }) => {
      queryClient.invalidateQueries({ queryKey: pollKeys.detail(pollId) });
      queryClient.invalidateQueries({ queryKey: pollKeys.lists() });
    },
  });
};

/**
 * Close a poll
 *
 * Invalidates detail and list caches on success.
 */
export const useClosePoll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tripId, pollId }: { tripId: string; pollId: string }) =>
      pollApi.close(tripId, pollId),
    onSuccess: (_data, { pollId }) => {
      logger.info('POLL', 'Poll closed successfully:', pollId);
      queryClient.invalidateQueries({ queryKey: pollKeys.detail(pollId) });
      queryClient.invalidateQueries({ queryKey: pollKeys.lists() });
    },
    onError: (error) => {
      logger.error('POLL', 'Failed to close poll:', error);
    },
  });
};

/**
 * Delete a poll
 *
 * Uses optimistic updates to remove the poll from the list immediately.
 */
export const useDeletePoll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tripId, pollId }: { tripId: string; pollId: string }) =>
      pollApi.deletePoll(tripId, pollId),
    onMutate: async ({ pollId }) => {
      await queryClient.cancelQueries({ queryKey: pollKeys.lists() });

      const previousLists = queryClient.getQueriesData<PollsResponse>({
        queryKey: pollKeys.lists(),
      });

      // Optimistically remove the poll from all matching list queries
      queryClient.setQueriesData<PollsResponse>({ queryKey: pollKeys.lists() }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((poll) => poll.id !== pollId),
          pagination: {
            ...old.pagination,
            total: Math.max(0, old.pagination.total - 1),
          },
        };
      });

      return { previousLists };
    },
    onError: (error, _variables, context) => {
      logger.error('POLL', 'Failed to delete poll:', error);
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (_, { pollId }) => {
      logger.info('POLL', 'Poll deleted successfully:', pollId);
      queryClient.invalidateQueries({ queryKey: pollKeys.lists() });
      queryClient.removeQueries({ queryKey: pollKeys.detail(pollId) });
    },
  });
};
