import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTripMembers, useUpdateMemberRole, useRemoveMember } from '../hooks';
import { tripApi } from '../api';
import { tripKeys } from '../queries';
import { TripMemberResponse } from '../types';

// Mock the API layer
jest.mock('../api', () => ({
  tripApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStatus: jest.fn(),
    inviteMember: jest.fn(),
    getMembers: jest.fn(),
    updateMemberRole: jest.fn(),
    removeMember: jest.fn(),
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn(),
    getInvitationDetails: jest.fn(),
    revokeInvitation: jest.fn(),
  },
}));

jest.mock('@/src/features/auth/store', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      user: { id: 'user-123', email: 'test@example.com' },
    })),
  },
}));

jest.mock('../adapters/normalizeTrip', () => ({
  normalizeTrip: jest.fn((trip: any) => trip),
}));

jest.mock('@/src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockedTripApi = tripApi as jest.Mocked<typeof tripApi>;

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('Trip Member Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useTripMembers', () => {
    it('fetches and returns member data correctly', async () => {
      const mockMembers: TripMemberResponse[] = [
        {
          membership: {
            id: 'mem-1',
            tripId: 'trip-123',
            userId: 'user-1',
            role: 'OWNER',
            status: 'ACTIVE',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          user: {
            id: 'user-1',
            email: 'alice@example.com',
            username: 'alice',
            firstName: 'Alice',
            lastName: 'Smith',
            displayName: 'Alice Smith',
          },
        },
      ];

      mockedTripApi.getMembers.mockResolvedValueOnce(mockMembers);

      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useTripMembers('trip-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMembers);
      expect(mockedTripApi.getMembers).toHaveBeenCalledWith('trip-123');
    });

    it('does not fetch when tripId is empty', () => {
      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useTripMembers(''), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(mockedTripApi.getMembers).not.toHaveBeenCalled();
    });

    it('uses correct query key', () => {
      const expectedKey = tripKeys.members('trip-123');
      expect(expectedKey).toEqual(['trips', 'members', 'trip-123']);
    });
  });

  describe('useUpdateMemberRole', () => {
    it('invalidates correct cache keys on success', async () => {
      mockedTripApi.updateMemberRole.mockResolvedValueOnce(undefined);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useUpdateMemberRole(), { wrapper });

      result.current.mutate({ tripId: 'trip-123', userId: 'user-2', role: 'admin' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedTripApi.updateMemberRole).toHaveBeenCalledWith('trip-123', 'user-2', 'admin');

      // Verify cache invalidation
      expect(invalidateQueriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: tripKeys.members('trip-123'),
        })
      );
      expect(invalidateQueriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: tripKeys.detail('trip-123'),
        })
      );

      invalidateQueriesSpy.mockRestore();
    });
  });

  describe('useRemoveMember', () => {
    it('invalidates correct cache keys on success', async () => {
      mockedTripApi.removeMember.mockResolvedValueOnce(undefined);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useRemoveMember(), { wrapper });

      result.current.mutate({ tripId: 'trip-123', userId: 'user-2' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedTripApi.removeMember).toHaveBeenCalledWith('trip-123', 'user-2');

      // Verify cache invalidation for both members and detail
      expect(invalidateQueriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: tripKeys.members('trip-123'),
        })
      );
      expect(invalidateQueriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: tripKeys.detail('trip-123'),
        })
      );

      invalidateQueriesSpy.mockRestore();
    });

    it('handles error state', async () => {
      mockedTripApi.removeMember.mockRejectedValueOnce(new Error('Forbidden'));

      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useRemoveMember(), { wrapper });

      result.current.mutate({ tripId: 'trip-123', userId: 'owner-1' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });
});
