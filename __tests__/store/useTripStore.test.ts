/**
 * @jest-environment jsdom
 */

// Set env variables before any imports
import { act } from '@testing-library/react-native';
import { useTripStore } from '@/src/store/useTripStore';
import { useAuthStore } from '@/src/store/useAuthStore';
import { createMockUser } from '@/__tests__/factories/user.factory';
import { createMockTrip, createMockMember } from '@/__tests__/factories/trip.factory';
import { resetAllStores, setupAuthenticatedUser } from '@/__tests__/helpers/store-helpers';
import { api } from '@/src/api/api-client';

process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock Supabase create client to avoid localStorage issues
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithIdToken: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
  })),
}));

// Mock Supabase client exports
jest.mock('@/src/auth/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithIdToken: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
  },
}));

// Mock API
jest.mock('@/src/api/api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  apiClient: {
    getAxiosInstance: jest.fn(() => ({ post: jest.fn() })),
  },
  registerAuthHandlers: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock logger
jest.mock('@/src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockUser = createMockUser();
const mockTrip = createMockTrip({
  name: 'Paris Adventure',
  description: 'A trip to Paris',
});

describe('useTripStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllStores();
    setupAuthenticatedUser(mockUser);
  });

  describe('createTrip', () => {
    it('should create a trip successfully', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockTrip });

      let result: any;
      await act(async () => {
        result = await useTripStore.getState().createTrip({
          name: 'Paris Adventure',
          description: 'A trip to Paris',
          startDate: new Date(mockTrip.startDate),
          endDate: new Date(mockTrip.endDate),
          destination: mockTrip.destination,
        });
      });

      expect(result.id).toBe('trip-123');
      expect(useTripStore.getState().trips).toHaveLength(1);
      expect(useTripStore.getState().loading).toBe(false);
    });

    it('should add creator as owner member', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockTrip });

      await act(async () => {
        await useTripStore.getState().createTrip({
          name: 'Test Trip',
          startDate: new Date(mockTrip.startDate),
          endDate: new Date(mockTrip.endDate),
          destination: mockTrip.destination,
        });
      });

      const trip = useTripStore.getState().trips[0];
      expect(trip.members).toHaveLength(1);
      expect(trip.members![0].role).toBe('owner');
      expect(trip.members![0].userId).toBe('user-123');
      expect(trip.members![0].name).toBe('Test User'); // firstName + lastName
    });

    it('should handle validation error for past start date', async () => {
      const error = new Error('Trip start date cannot be in the past');
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(
        useTripStore.getState().createTrip({
          name: 'Past Trip',
          startDate: new Date('2020-01-01T00:00:00Z'),
          endDate: new Date('2020-01-10T00:00:00Z'),
          destination: mockTrip.destination,
        })
      ).rejects.toThrow('Trip start date cannot be in the past');

      expect(useTripStore.getState().error).toBe('Trip start date cannot be in the past');
    });

    it('should handle validation error for invalid coordinates', async () => {
      const error = new Error('Latitude must be between -90 and 90');
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(
        useTripStore.getState().createTrip({
          name: 'Invalid Location Trip',
          startDate: new Date(mockTrip.startDate),
          endDate: new Date(mockTrip.endDate),
          destination: {
            address: 'Invalid',
            coordinates: { lat: 100, lng: 200 },
            placeId: 'invalid-123',
          },
        })
      ).rejects.toThrow('Latitude must be between -90 and 90');
    });

    it('should require authenticated user', async () => {
      useAuthStore.setState({ user: null });

      await expect(
        useTripStore.getState().createTrip({
          name: 'Test',
          startDate: new Date(mockTrip.startDate),
          endDate: new Date(mockTrip.endDate),
          destination: mockTrip.destination,
        })
      ).rejects.toThrow('User must be logged in');
    });

    it('should set loading state during creation', async () => {
      (api.post as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: mockTrip }), 100))
      );

      const createPromise = useTripStore.getState().createTrip({
        name: 'Test',
        startDate: new Date(mockTrip.startDate),
        endDate: new Date(mockTrip.endDate),
        destination: mockTrip.destination,
      });

      // Check loading is true during request
      expect(useTripStore.getState().loading).toBe(true);

      await act(async () => {
        await createPromise;
      });

      // Check loading is false after completion
      expect(useTripStore.getState().loading).toBe(false);
    });
  });

  describe('fetchTrips', () => {
    it('should fetch and store trips', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [mockTrip] });

      await act(async () => {
        await useTripStore.getState().fetchTrips();
      });

      expect(useTripStore.getState().trips).toHaveLength(1);
      expect(useTripStore.getState().trips[0].name).toBe('Paris Adventure');
    });

    it('should ensure creator is in members list', async () => {
      const tripWithoutMembers = { ...mockTrip, members: [] };
      (api.get as jest.Mock).mockResolvedValue({ data: [tripWithoutMembers] });

      await act(async () => {
        await useTripStore.getState().fetchTrips();
      });

      const trip = useTripStore.getState().trips[0];
      expect(trip.members!.length).toBeGreaterThan(0);
      expect(trip.members![0].role).toBe('owner');
    });

    it('should add creator if missing from members', async () => {
      const tripWithOtherMembers = {
        ...mockTrip,
        members: [
          {
            userId: 'user-456',
            name: 'Other User',
            role: 'member' as const,
            joinedAt: new Date().toISOString(),
          },
        ],
      };
      (api.get as jest.Mock).mockResolvedValue({ data: [tripWithOtherMembers] });

      await act(async () => {
        await useTripStore.getState().fetchTrips();
      });

      const trip = useTripStore.getState().trips[0];
      expect(trip.members!.length).toBe(2);
      const creator = trip.members!.find(m => m.userId === mockTrip.createdBy);
      expect(creator).toBeDefined();
      expect(creator!.role).toBe('owner');
    });

    it('should handle API error', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(useTripStore.getState().fetchTrips()).rejects.toThrow();
      expect(useTripStore.getState().error).toBe('Network error');
    });

    it('should add names to members without names', async () => {
      const tripWithUnnamedMembers = {
        ...mockTrip,
        members: [
          {
            userId: 'user-123', // Current user
            role: 'owner' as const,
            joinedAt: new Date().toISOString(),
          },
          {
            userId: 'user-789',
            role: 'member' as const,
            joinedAt: new Date().toISOString(),
          },
        ],
      };
      (api.get as jest.Mock).mockResolvedValue({ data: [tripWithUnnamedMembers] });

      await act(async () => {
        await useTripStore.getState().fetchTrips();
      });

      const trip = useTripStore.getState().trips[0];
      expect(trip.members![0].name).toBe('Test User'); // Current user gets full name
      expect(trip.members![1].name).toContain('Member'); // Other user gets placeholder
    });
  });

  describe('updateTrip', () => {
    beforeEach(() => {
      useTripStore.setState({ trips: [mockTrip] });
    });

    it('should update trip successfully', async () => {
      const updatedTrip = { ...mockTrip, name: 'Updated Trip Name' };
      (api.put as jest.Mock).mockResolvedValue({ data: updatedTrip });

      await act(async () => {
        await useTripStore.getState().updateTrip('trip-123', { name: 'Updated Trip Name' });
      });

      expect(useTripStore.getState().trips[0].name).toBe('Updated Trip Name');
    });

    it('should handle 404 not found error', async () => {
      const error = new Error('Trip not found');
      (api.put as jest.Mock).mockRejectedValue(error);

      await expect(
        useTripStore.getState().updateTrip('nonexistent', { name: 'Test' })
      ).rejects.toThrow('Trip not found');
    });

    it('should update multiple fields', async () => {
      const updatedTrip = {
        ...mockTrip,
        name: 'New Name',
        description: 'New Description',
      };
      (api.put as jest.Mock).mockResolvedValue({ data: updatedTrip });

      await act(async () => {
        await useTripStore.getState().updateTrip('trip-123', {
          name: 'New Name',
          description: 'New Description',
        });
      });

      const trip = useTripStore.getState().trips[0];
      expect(trip.name).toBe('New Name');
      expect(trip.description).toBe('New Description');
    });

    it('should preserve other trips when updating one', async () => {
      const secondTrip = { ...mockTrip, id: 'trip-456', name: 'Second Trip' };
      useTripStore.setState({ trips: [mockTrip, secondTrip] });

      const updatedTrip = { ...mockTrip, name: 'Updated' };
      (api.put as jest.Mock).mockResolvedValue({ data: updatedTrip });

      await act(async () => {
        await useTripStore.getState().updateTrip('trip-123', { name: 'Updated' });
      });

      const trips = useTripStore.getState().trips;
      expect(trips).toHaveLength(2);
      expect(trips[0].name).toBe('Updated');
      expect(trips[1].name).toBe('Second Trip');
    });
  });

  describe('deleteTrip', () => {
    beforeEach(() => {
      useTripStore.setState({ trips: [mockTrip] });
    });

    it('should delete trip and remove from state', async () => {
      (api.delete as jest.Mock).mockResolvedValue({});

      await act(async () => {
        await useTripStore.getState().deleteTrip('trip-123');
      });

      expect(useTripStore.getState().trips).toHaveLength(0);
    });

    it('should handle delete error', async () => {
      const error = new Error('Not authorized');
      (api.delete as jest.Mock).mockRejectedValue(error);

      await expect(useTripStore.getState().deleteTrip('trip-123')).rejects.toThrow('Not authorized');
    });

    it('should only delete specified trip', async () => {
      const secondTrip = { ...mockTrip, id: 'trip-456', name: 'Second Trip' };
      useTripStore.setState({ trips: [mockTrip, secondTrip] });

      (api.delete as jest.Mock).mockResolvedValue({});

      await act(async () => {
        await useTripStore.getState().deleteTrip('trip-123');
      });

      const trips = useTripStore.getState().trips;
      expect(trips).toHaveLength(1);
      expect(trips[0].id).toBe('trip-456');
    });
  });

  describe('updateTripStatus', () => {
    beforeEach(() => {
      useTripStore.setState({ trips: [mockTrip] });
    });

    it('should update trip status', async () => {
      (api.patch as jest.Mock).mockResolvedValue({ data: { status: 'ACTIVE' } });

      await act(async () => {
        await useTripStore.getState().updateTripStatus('trip-123', 'ACTIVE');
      });

      expect(useTripStore.getState().trips[0].status).toBe('ACTIVE');
    });

    it('should handle invalid status transition error', async () => {
      const error = new Error('Cannot reactivate a completed trip');
      (api.patch as jest.Mock).mockRejectedValue(error);

      useTripStore.setState({ trips: [{ ...mockTrip, status: 'COMPLETED' }] });

      await expect(
        useTripStore.getState().updateTripStatus('trip-123', 'ACTIVE')
      ).rejects.toThrow('Cannot reactivate a completed trip');
    });

    it('should allow valid status transitions', async () => {
      // PLANNING -> ACTIVE
      (api.patch as jest.Mock).mockResolvedValue({ data: { status: 'ACTIVE' } });
      await act(async () => {
        await useTripStore.getState().updateTripStatus('trip-123', 'ACTIVE');
      });
      expect(useTripStore.getState().trips[0].status).toBe('ACTIVE');

      // ACTIVE -> COMPLETED
      useTripStore.setState({ trips: [{ ...mockTrip, status: 'ACTIVE' }] });
      (api.patch as jest.Mock).mockResolvedValue({ data: { status: 'COMPLETED' } });
      await act(async () => {
        await useTripStore.getState().updateTripStatus('trip-123', 'COMPLETED');
      });
      expect(useTripStore.getState().trips[0].status).toBe('COMPLETED');
    });
  });

  describe('inviteMember', () => {
    it('should send invitation successfully', async () => {
      (api.post as jest.Mock).mockResolvedValue({});

      await act(async () => {
        await useTripStore.getState().inviteMember('trip-123', 'newmember@example.com', 'member');
      });

      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining('invitations'),
        expect.objectContaining({ email: 'newmember@example.com', role: 'MEMBER' })
      );
    });

    it('should handle already member error', async () => {
      const error = {
        response: {
          status: 409,
          data: { type: 'CONFLICT_ERROR', code: 'ALREADY_MEMBER', message: 'User is already a member' },
        },
      };
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(
        useTripStore.getState().inviteMember('trip-123', 'existing@example.com', 'member')
      ).rejects.toThrow('Failed to send invitation');
    });

    it('should convert role to uppercase', async () => {
      (api.post as jest.Mock).mockResolvedValue({});

      await act(async () => {
        await useTripStore.getState().inviteMember('trip-123', 'admin@example.com', 'admin');
      });

      expect(api.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ role: 'ADMIN' })
      );
    });
  });

  describe('removeMember', () => {
    beforeEach(() => {
      const tripWithMembers = createMockTrip({
        members: [
          createMockMember({ userId: 'user-123', name: 'Owner', role: 'owner' }),
          createMockMember({ userId: 'user-456', name: 'Member', role: 'member' }),
        ],
      });
      useTripStore.setState({ trips: [tripWithMembers] });
    });

    it('should remove member and update state', async () => {
      (api.delete as jest.Mock).mockResolvedValue({});

      await act(async () => {
        await useTripStore.getState().removeMember('trip-123', 'user-456');
      });

      const trip = useTripStore.getState().trips[0];
      expect(trip.members).toHaveLength(1);
      expect(trip.members![0].userId).toBe('user-123');
    });

    it('should handle cannot remove last owner error', async () => {
      const error = {
        response: {
          status: 403,
          data: {
            type: 'BUSINESS_LOGIC_ERROR',
            code: 'CANNOT_REMOVE_OWNER',
            message: 'Cannot remove the last owner from trip',
          },
        },
      };
      (api.delete as jest.Mock).mockRejectedValue(error);

      await expect(
        useTripStore.getState().removeMember('trip-123', 'user-123')
      ).rejects.toThrow('Failed to remove member');
    });

    it('should call correct API endpoint', async () => {
      (api.delete as jest.Mock).mockResolvedValue({});

      await act(async () => {
        await useTripStore.getState().removeMember('trip-123', 'user-456');
      });

      expect(api.delete).toHaveBeenCalledWith(
        expect.stringContaining('trips/trip-123/members/user-456')
      );
    });
  });

  describe('updateMemberRole', () => {
    beforeEach(() => {
      const tripWithMembers = createMockTrip({
        members: [
          createMockMember({ userId: 'user-123', name: 'Owner', role: 'owner' }),
          createMockMember({ userId: 'user-456', name: 'Member', role: 'member' }),
        ],
      });
      useTripStore.setState({ trips: [tripWithMembers] });
    });

    it('should update member role', async () => {
      (api.patch as jest.Mock).mockResolvedValue({});

      await act(async () => {
        await useTripStore.getState().updateMemberRole('trip-123', 'user-456', 'admin');
      });

      const trip = useTripStore.getState().trips[0];
      const member = trip.members!.find(m => m.userId === 'user-456');
      expect(member!.role).toBe('admin');
    });

    it('should send uppercase role to API', async () => {
      (api.patch as jest.Mock).mockResolvedValue({});

      await act(async () => {
        await useTripStore.getState().updateMemberRole('trip-123', 'user-456', 'admin');
      });

      expect(api.patch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ role: 'ADMIN' })
      );
    });

    it('should handle permission error', async () => {
      const error = {
        response: {
          status: 403,
          data: { type: 'AUTHORIZATION_ERROR', message: 'Not authorized to update roles' },
        },
      };
      (api.patch as jest.Mock).mockRejectedValue(error);

      await expect(
        useTripStore.getState().updateMemberRole('trip-123', 'user-456', 'admin')
      ).rejects.toThrow('Failed to update member role');
    });
  });

  describe('getTripById', () => {
    it('should return trip by id', () => {
      useTripStore.setState({ trips: [mockTrip] });

      const trip = useTripStore.getState().getTripById('trip-123');
      expect(trip?.id).toBe('trip-123');
    });

    it('should return undefined for non-existent trip', () => {
      const trip = useTripStore.getState().getTripById('nonexistent');
      expect(trip).toBeUndefined();
    });

    it('should ensure creator is in members list', () => {
      useTripStore.setState({ trips: [{ ...mockTrip, members: [] }] });

      const trip = useTripStore.getState().getTripById('trip-123');
      expect(trip?.members).toHaveLength(1);
      expect(trip?.members![0].role).toBe('owner');
    });

    it('should add creator if missing from members', () => {
      useTripStore.setState({
        trips: [{
          ...mockTrip,
          members: [
            {
              userId: 'user-789',
              name: 'Other User',
              role: 'member',
              joinedAt: new Date().toISOString(),
            },
          ],
        }],
      });

      const trip = useTripStore.getState().getTripById('trip-123');
      expect(trip?.members!.length).toBe(2);
      const creator = trip?.members!.find(m => m.userId === mockTrip.createdBy);
      expect(creator).toBeDefined();
      expect(creator!.role).toBe('owner');
    });
  });

  describe('setSelectedTrip', () => {
    it('should set selected trip', () => {
      useTripStore.getState().setSelectedTrip(mockTrip);
      expect(useTripStore.getState().selectedTrip).toEqual(mockTrip);
    });

    it('should clear selected trip when set to null', () => {
      useTripStore.setState({ selectedTrip: mockTrip });
      useTripStore.getState().setSelectedTrip(null);
      expect(useTripStore.getState().selectedTrip).toBeNull();
    });
  });

  describe('revokeInvitation', () => {
    beforeEach(() => {
      const tripWithInvitations = createMockTrip({
        invitations: [
          {
            email: 'invited@example.com',
            status: 'pending' as const,
            token: 'invitation-token-123',
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
        ],
      });
      useTripStore.setState({ trips: [tripWithInvitations] });
    });

    it('should revoke invitation and update state', async () => {
      (api.delete as jest.Mock).mockResolvedValue({});

      await act(async () => {
        await useTripStore.getState().revokeInvitation('trip-123', 'invitation-token-123');
      });

      const trip = useTripStore.getState().trips[0];
      expect(trip.invitations).toHaveLength(0);
    });

    it('should handle revoke error', async () => {
      const error = {
        response: {
          status: 404,
          data: { type: 'RESOURCE_ERROR', message: 'Invitation not found' },
        },
      };
      (api.delete as jest.Mock).mockRejectedValue(error);

      await expect(
        useTripStore.getState().revokeInvitation('trip-123', 'invalid-token')
      ).rejects.toThrow('Failed to revoke invitation');
    });
  });

  describe('error handling', () => {
    it('should clear error on successful operation', async () => {
      // First set an error
      useTripStore.setState({ error: 'Previous error' });

      (api.get as jest.Mock).mockResolvedValue({ data: [mockTrip] });

      await act(async () => {
        await useTripStore.getState().fetchTrips();
      });

      expect(useTripStore.getState().error).toBeNull();
    });

    it('should set error on failed operation', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(useTripStore.getState().fetchTrips()).rejects.toThrow();
      expect(useTripStore.getState().error).toBe('API Error');
    });
  });

  describe('user display name', () => {
    it('should use firstName and lastName when available', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockTrip });

      await act(async () => {
        await useTripStore.getState().createTrip({
          name: 'Test',
          startDate: new Date(mockTrip.startDate),
          endDate: new Date(mockTrip.endDate),
          destination: mockTrip.destination,
        });
      });

      const trip = useTripStore.getState().trips[0];
      expect(trip.members![0].name).toBe('Test User');
    });

    it('should use firstName only if lastName missing', async () => {
      useAuthStore.setState({
        user: { ...mockUser, lastName: undefined },
      });

      (api.post as jest.Mock).mockResolvedValue({ data: mockTrip });

      await act(async () => {
        await useTripStore.getState().createTrip({
          name: 'Test',
          startDate: new Date(mockTrip.startDate),
          endDate: new Date(mockTrip.endDate),
          destination: mockTrip.destination,
        });
      });

      const trip = useTripStore.getState().trips[0];
      expect(trip.members![0].name).toBe('Test');
    });

    it('should use username if no first/last name', async () => {
      useAuthStore.setState({
        user: { ...mockUser, firstName: undefined, lastName: undefined },
      });

      (api.post as jest.Mock).mockResolvedValue({ data: mockTrip });

      await act(async () => {
        await useTripStore.getState().createTrip({
          name: 'Test',
          startDate: new Date(mockTrip.startDate),
          endDate: new Date(mockTrip.endDate),
          destination: mockTrip.destination,
        });
      });

      const trip = useTripStore.getState().trips[0];
      expect(trip.members![0].name).toBe('testuser');
    });

    it('should derive name from email if no other info', async () => {
      useAuthStore.setState({
        user: {
          ...mockUser,
          firstName: undefined,
          lastName: undefined,
          username: '',
          email: 'john.doe@example.com',
        },
      });

      (api.post as jest.Mock).mockResolvedValue({ data: mockTrip });

      await act(async () => {
        await useTripStore.getState().createTrip({
          name: 'Test',
          startDate: new Date(mockTrip.startDate),
          endDate: new Date(mockTrip.endDate),
          destination: mockTrip.destination,
        });
      });

      const trip = useTripStore.getState().trips[0];
      expect(trip.members![0].name).toBe('John Doe'); // Derived from email
    });
  });
});
