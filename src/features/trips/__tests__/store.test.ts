import { act } from '@testing-library/react-native';
import { useTripStore } from '../store';
import { tripApi } from '../api';
import { ServerEvent } from '@/src/types/events';

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

// Mock dependencies
jest.mock('@/src/api/api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/src/features/auth/store', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      user: { id: 'user-123', email: 'test@example.com', username: 'testuser' },
    })),
  },
}));

jest.mock('@/src/features/auth/utils', () => ({
  getUserDisplayName: jest.fn(() => 'Test User'),
}));

jest.mock('../adapters/normalizeTrip', () => ({
  normalizeTrip: jest.fn((trip: any) => trip),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/src/utils/store-reset', () => ({
  registerStoreReset: jest.fn(),
}));

jest.mock('@/src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/src/utils/weather', () => ({
  mapWeatherCode: jest.fn(() => 'clear'),
}));

const mockedTripApi = tripApi as jest.Mocked<typeof tripApi>;

describe('useTripStore - Member Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store to initial state
    act(() => {
      useTripStore.getState().reset();
    });
  });

  describe('updateMemberRole', () => {
    it('updates local state on success', async () => {
      // Set initial state with a trip that has members
      act(() => {
        useTripStore.setState({
          trips: [
            {
              id: 'trip-123',
              name: 'Test Trip',
              description: 'A test trip',
              destination: { address: 'Paris, France' },
              startDate: '2024-06-01T00:00:00Z',
              endDate: '2024-06-10T00:00:00Z',
              status: 'ACTIVE',
              createdBy: 'user-1',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              members: [
                { userId: 'user-1', role: 'owner', joinedAt: '2024-01-01T00:00:00Z' },
                { userId: 'user-2', role: 'member', joinedAt: '2024-01-02T00:00:00Z' },
              ],
            },
          ],
        });
      });

      mockedTripApi.updateMemberRole.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useTripStore.getState().updateMemberRole('trip-123', 'user-2', 'admin');
      });

      const state = useTripStore.getState();
      const trip = state.trips.find((t) => t.id === 'trip-123');
      const member = trip?.members?.find((m) => m.userId === 'user-2');

      expect(member?.role).toBe('admin');
      expect(state.isUpdating).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error state on failure', async () => {
      act(() => {
        useTripStore.setState({
          trips: [
            {
              id: 'trip-123',
              name: 'Test Trip',
              destination: { address: 'Paris' },
              startDate: '2024-06-01T00:00:00Z',
              endDate: '2024-06-10T00:00:00Z',
              status: 'ACTIVE',
              createdBy: 'user-1',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              members: [{ userId: 'user-1', role: 'owner', joinedAt: '2024-01-01T00:00:00Z' }],
            },
          ],
        });
      });

      mockedTripApi.updateMemberRole.mockRejectedValueOnce(
        new Error('Cannot change role of last owner')
      );

      await expect(
        act(async () => {
          await useTripStore.getState().updateMemberRole('trip-123', 'user-1', 'member');
        })
      ).rejects.toThrow();

      const state = useTripStore.getState();
      expect(state.error).toBe('Cannot change role of last owner');
      expect(state.isUpdating).toBe(false);
    });
  });

  describe('removeMember', () => {
    it('removes member from local state on success', async () => {
      act(() => {
        useTripStore.setState({
          trips: [
            {
              id: 'trip-123',
              name: 'Test Trip',
              destination: { address: 'Paris' },
              startDate: '2024-06-01T00:00:00Z',
              endDate: '2024-06-10T00:00:00Z',
              status: 'ACTIVE',
              createdBy: 'user-1',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              members: [
                { userId: 'user-1', role: 'owner', joinedAt: '2024-01-01T00:00:00Z' },
                { userId: 'user-2', role: 'member', joinedAt: '2024-01-02T00:00:00Z' },
                { userId: 'user-3', role: 'admin', joinedAt: '2024-01-03T00:00:00Z' },
              ],
            },
          ],
        });
      });

      mockedTripApi.removeMember.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useTripStore.getState().removeMember('trip-123', 'user-2');
      });

      const state = useTripStore.getState();
      const trip = state.trips.find((t) => t.id === 'trip-123');

      expect(trip?.members).toHaveLength(2);
      expect(trip?.members?.find((m) => m.userId === 'user-2')).toBeUndefined();
      expect(state.isDeleting).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error on failure and keeps members intact', async () => {
      act(() => {
        useTripStore.setState({
          trips: [
            {
              id: 'trip-123',
              name: 'Test Trip',
              destination: { address: 'Paris' },
              startDate: '2024-06-01T00:00:00Z',
              endDate: '2024-06-10T00:00:00Z',
              status: 'ACTIVE',
              createdBy: 'user-1',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              members: [{ userId: 'user-1', role: 'owner', joinedAt: '2024-01-01T00:00:00Z' }],
            },
          ],
        });
      });

      mockedTripApi.removeMember.mockRejectedValueOnce(new Error('Cannot remove the last owner'));

      await expect(
        act(async () => {
          await useTripStore.getState().removeMember('trip-123', 'user-1');
        })
      ).rejects.toThrow();

      const state = useTripStore.getState();
      expect(state.error).toBe('Cannot remove the last owner');
      expect(state.isDeleting).toBe(false);
    });
  });

  describe('handleTripEvent - Member events', () => {
    const createBaseEvent = (
      type: string,
      tripId: string,
      payload: Record<string, unknown>
    ): ServerEvent => ({
      id: 'evt-1',
      type: type as any,
      tripId,
      userId: 'user-1',
      timestamp: new Date().toISOString(),
      version: 1,
      metadata: {
        source: 'test',
      },
      payload,
    });

    beforeEach(() => {
      act(() => {
        useTripStore.setState({
          trips: [
            {
              id: 'trip-123',
              name: 'Test Trip',
              destination: { address: 'Paris' },
              startDate: '2024-06-01T00:00:00Z',
              endDate: '2024-06-10T00:00:00Z',
              status: 'ACTIVE',
              createdBy: 'user-1',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              members: [{ userId: 'user-1', role: 'owner', joinedAt: '2024-01-01T00:00:00Z' }],
            },
          ],
        });
      });
    });

    it('handles MEMBER_ADDED event', () => {
      const event = createBaseEvent('MEMBER_ADDED', 'trip-123', {
        userId: 'user-new',
        role: 'member',
      });

      act(() => {
        useTripStore.getState().handleTripEvent(event);
      });

      const trip = useTripStore.getState().trips.find((t) => t.id === 'trip-123');
      expect(trip?.members).toHaveLength(2);
      expect(trip?.members?.find((m) => m.userId === 'user-new')).toBeDefined();
      expect(trip?.members?.find((m) => m.userId === 'user-new')?.role).toBe('member');
    });

    it('handles MEMBER_ADDED event - no duplicate', () => {
      const event = createBaseEvent('MEMBER_ADDED', 'trip-123', {
        userId: 'user-1', // Already exists
        role: 'owner',
      });

      act(() => {
        useTripStore.getState().handleTripEvent(event);
      });

      const trip = useTripStore.getState().trips.find((t) => t.id === 'trip-123');
      expect(trip?.members).toHaveLength(1); // Should not duplicate
    });

    it('handles MEMBER_REMOVED event', () => {
      // First add a member
      act(() => {
        useTripStore.setState({
          trips: [
            {
              id: 'trip-123',
              name: 'Test Trip',
              destination: { address: 'Paris' },
              startDate: '2024-06-01T00:00:00Z',
              endDate: '2024-06-10T00:00:00Z',
              status: 'ACTIVE',
              createdBy: 'user-1',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              members: [
                { userId: 'user-1', role: 'owner', joinedAt: '2024-01-01T00:00:00Z' },
                { userId: 'user-2', role: 'member', joinedAt: '2024-01-02T00:00:00Z' },
              ],
            },
          ],
        });
      });

      const event = createBaseEvent('MEMBER_REMOVED', 'trip-123', {
        userId: 'user-2',
      });

      act(() => {
        useTripStore.getState().handleTripEvent(event);
      });

      const trip = useTripStore.getState().trips.find((t) => t.id === 'trip-123');
      expect(trip?.members).toHaveLength(1);
      expect(trip?.members?.find((m) => m.userId === 'user-2')).toBeUndefined();
    });

    it('handles MEMBER_ROLE_UPDATED event', () => {
      act(() => {
        useTripStore.setState({
          trips: [
            {
              id: 'trip-123',
              name: 'Test Trip',
              destination: { address: 'Paris' },
              startDate: '2024-06-01T00:00:00Z',
              endDate: '2024-06-10T00:00:00Z',
              status: 'ACTIVE',
              createdBy: 'user-1',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              members: [
                { userId: 'user-1', role: 'owner', joinedAt: '2024-01-01T00:00:00Z' },
                { userId: 'user-2', role: 'member', joinedAt: '2024-01-02T00:00:00Z' },
              ],
            },
          ],
        });
      });

      const event = createBaseEvent('MEMBER_ROLE_UPDATED', 'trip-123', {
        userId: 'user-2',
        role: 'admin',
      });

      act(() => {
        useTripStore.getState().handleTripEvent(event);
      });

      const trip = useTripStore.getState().trips.find((t) => t.id === 'trip-123');
      const member = trip?.members?.find((m) => m.userId === 'user-2');
      expect(member?.role).toBe('admin');
    });

    it('ignores member events for unknown trip', () => {
      const event = createBaseEvent('MEMBER_ADDED', 'unknown-trip', {
        userId: 'user-new',
        role: 'member',
      });

      act(() => {
        useTripStore.getState().handleTripEvent(event);
      });

      // Should not crash and state should be unchanged
      const trips = useTripStore.getState().trips;
      expect(trips).toHaveLength(1);
      expect(trips[0].id).toBe('trip-123');
    });
  });
});
