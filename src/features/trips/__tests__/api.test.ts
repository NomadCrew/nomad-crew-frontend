import { api } from '@/src/api/api-client';
import { tripApi } from '../api';
import { API_PATHS } from '@/src/utils/api-paths';
import { TripMemberResponse } from '../types';

// Mock the api client
jest.mock('@/src/api/api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the auth store (used in tripApi.create)
jest.mock('@/src/features/auth/store', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      user: { id: 'user-123', email: 'test@example.com' },
    })),
  },
}));

// Mock normalizeTrip adapter
jest.mock('../adapters/normalizeTrip', () => ({
  normalizeTrip: jest.fn((trip: any) => trip),
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('tripApi - Member Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMembers', () => {
    it('calls correct endpoint with trip ID', async () => {
      const tripId = 'trip-123';
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
        {
          membership: {
            id: 'mem-2',
            tripId: 'trip-123',
            userId: 'user-2',
            role: 'MEMBER',
            status: 'ACTIVE',
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
          user: {
            id: 'user-2',
            email: 'bob@example.com',
            username: 'bob',
          },
        },
      ];

      mockedApi.get.mockResolvedValueOnce({ data: mockMembers, status: 200 });

      const result = await tripApi.getMembers(tripId);

      expect(mockedApi.get).toHaveBeenCalledWith(API_PATHS.trips.members(tripId));
      expect(result).toEqual(mockMembers);
      expect(result).toHaveLength(2);
    });

    it('throws on network error', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Network Error'));

      await expect(tripApi.getMembers('trip-123')).rejects.toThrow('Network Error');
    });
  });

  describe('updateMemberRole', () => {
    it('sends correct payload with uppercase role', async () => {
      const tripId = 'trip-123';
      const userId = 'user-456';
      const role = 'admin';

      mockedApi.put.mockResolvedValueOnce({ data: {}, status: 200 });

      await tripApi.updateMemberRole(tripId, userId, role);

      expect(mockedApi.put).toHaveBeenCalledWith(API_PATHS.trips.memberRole(tripId, userId), {
        role: 'ADMIN',
      });
    });

    it('sends uppercase role even when already uppercase', async () => {
      mockedApi.put.mockResolvedValueOnce({ data: {}, status: 200 });

      await tripApi.updateMemberRole('trip-123', 'user-456', 'MEMBER');

      expect(mockedApi.put).toHaveBeenCalledWith(
        API_PATHS.trips.memberRole('trip-123', 'user-456'),
        { role: 'MEMBER' }
      );
    });

    it('throws on forbidden error', async () => {
      mockedApi.put.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { message: 'Cannot change role of last owner' },
        },
      });

      await expect(tripApi.updateMemberRole('trip-123', 'owner-1', 'member')).rejects.toEqual(
        expect.objectContaining({
          response: expect.objectContaining({ status: 403 }),
        })
      );
    });
  });

  describe('removeMember', () => {
    it('calls correct endpoint', async () => {
      const tripId = 'trip-123';
      const userId = 'user-456';

      mockedApi.delete.mockResolvedValueOnce({ data: {}, status: 204 });

      await tripApi.removeMember(tripId, userId);

      expect(mockedApi.delete).toHaveBeenCalledWith(API_PATHS.trips.removeMember(tripId, userId));
    });

    it('throws on not found error', async () => {
      mockedApi.delete.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: 'Member not found' },
        },
      });

      await expect(tripApi.removeMember('trip-123', 'nonexistent')).rejects.toEqual(
        expect.objectContaining({
          response: expect.objectContaining({ status: 404 }),
        })
      );
    });

    it('throws on forbidden (last owner)', async () => {
      mockedApi.delete.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { message: 'Cannot remove the last owner' },
        },
      });

      await expect(tripApi.removeMember('trip-123', 'owner-1')).rejects.toEqual(
        expect.objectContaining({
          response: expect.objectContaining({ status: 403 }),
        })
      );
    });
  });

  describe('inviteMember', () => {
    it('sends invite with correct payload', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: {}, status: 200 });

      await tripApi.inviteMember('trip-123', 'alice@example.com', 'member');

      expect(mockedApi.post).toHaveBeenCalledWith(API_PATHS.trips.invite('trip-123'), {
        email: 'alice@example.com',
        role: 'member',
      });
    });
  });
});
