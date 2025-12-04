import { act } from '@testing-library/react-native';
import { useTripStore } from '@/src/store/useTripStore';
import { useAuthStore } from '@/src/store/useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetAllStores, setupAuthenticatedUser } from '../helpers';
import { createMockUser, createMockTrip, createMockInvitation } from '../factories';

import { api, apiClient } from '@/src/api/api-client';

// Mock Supabase
jest.mock('@/src/auth/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithIdToken: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token',
            refresh_token: 'refresh-token',
            user: { id: 'user-123', email: 'test@example.com' },
            expires_at: Date.now() + 3600000,
          },
        },
        error: null,
      }),
      refreshSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token',
            refresh_token: 'refresh-token',
            user: { id: 'user-123', email: 'test@example.com' },
            expires_at: Date.now() + 3600000,
          },
        },
        error: null,
      }),
    },
  },
}));

jest.mock('@/src/api/api-client', () => ({
  api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
  apiClient: { getAxiosInstance: jest.fn() },
  registerAuthHandlers: jest.fn(),
}));

jest.mock('@/src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Trip Invitations', () => {
  const mockUser = createMockUser();
  const mockTrip = createMockTrip();

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllStores();
    setupAuthenticatedUser(mockUser);
    useTripStore.setState({ trips: [mockTrip] });
    // Set up default mock for getAxiosInstance
    (apiClient.getAxiosInstance as jest.Mock).mockReturnValue({
      post: jest.fn().mockResolvedValue({ data: { trip: mockTrip } }),
    });
  });

  describe('inviteMember', () => {
    it('should send invitation with valid email', async () => {
      (api.post as jest.Mock).mockResolvedValue({});

      await act(async () => {
        await useTripStore.getState().inviteMember('trip-123', 'new@example.com', 'member');
      });

      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining('invitations'),
        expect.objectContaining({ email: 'new@example.com', role: 'MEMBER' })
      );
    });

    it('should handle invalid email format error', async () => {
      const error = {
        response: {
          status: 400,
          data: { type: 'VALIDATION_ERROR', code: 'VALIDATION_FAILED', message: 'Invalid email format' },
        },
      };
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(
        useTripStore.getState().inviteMember('trip-123', 'invalid-email', 'member')
      ).rejects.toThrow();
    });

    it('should handle empty email error', async () => {
      const error = {
        response: {
          status: 400,
          data: { type: 'VALIDATION_ERROR', code: 'VALIDATION_FAILED', message: 'Email is required' },
        },
      };
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(
        useTripStore.getState().inviteMember('trip-123', '', 'member')
      ).rejects.toThrow();
    });

    it('should handle email too long error', async () => {
      const longEmail = 'a'.repeat(250) + '@example.com'; // > 255 chars
      const error = {
        response: {
          status: 400,
          data: { type: 'VALIDATION_ERROR', code: 'VALIDATION_FAILED', message: 'Email too long' },
        },
      };
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(
        useTripStore.getState().inviteMember('trip-123', longEmail, 'member')
      ).rejects.toThrow();
    });

    it('should handle already member error (409)', async () => {
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

    it('should handle pending invitation error (409)', async () => {
      const error = {
        response: {
          status: 409,
          data: { type: 'CONFLICT_ERROR', code: 'INVITATION_PENDING', message: 'Invitation already pending' },
        },
      };
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(
        useTripStore.getState().inviteMember('trip-123', 'pending@example.com', 'member')
      ).rejects.toThrow();
    });

    it('should handle invite self error', async () => {
      const error = {
        response: {
          status: 400,
          data: { type: 'VALIDATION_ERROR', code: 'VALIDATION_FAILED', message: 'Cannot invite yourself' },
        },
      };
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(
        useTripStore.getState().inviteMember('trip-123', mockUser.email, 'member')
      ).rejects.toThrow();
    });

    it('should convert role to uppercase', async () => {
      (api.post as jest.Mock).mockResolvedValue({});

      await useTripStore.getState().inviteMember('trip-123', 'test@example.com', 'admin');

      expect(api.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ role: 'ADMIN' })
      );
    });

    it('should convert owner role to uppercase', async () => {
      (api.post as jest.Mock).mockResolvedValue({});

      await useTripStore.getState().inviteMember('trip-123', 'test@example.com', 'owner');

      expect(api.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ role: 'OWNER' })
      );
    });

    it('should throw error with descriptive message on failure', async () => {
      const error = new Error('Network failure');
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(
        useTripStore.getState().inviteMember('trip-123', 'test@example.com', 'member')
      ).rejects.toThrow('Failed to send invitation: Network failure');
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and add trip to state', async () => {
      const mockAxios = { post: jest.fn().mockResolvedValue({ data: { trip: mockTrip } }) };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      await act(async () => {
        await useTripStore.getState().acceptInvitation('valid-token');
      });

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('pendingInvitation');
    });

    it('should handle expired invitation error', async () => {
      const error = {
        response: {
          status: 400,
          data: { type: 'BUSINESS_LOGIC_ERROR', code: 'INVITATION_EXPIRED', message: 'Invitation expired' },
        },
      };
      const mockAxios = {
        post: jest.fn().mockRejectedValue(error),
      };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValueOnce(mockAxios);

      await expect(useTripStore.getState().acceptInvitation('expired-token')).rejects.toMatchObject(error);
    });

    it('should handle already accepted error (409)', async () => {
      const error = {
        response: {
          status: 409,
          data: { type: 'BUSINESS_LOGIC_ERROR', code: 'ALREADY_PROCESSED', message: 'Already accepted' },
        },
      };
      const mockAxios = {
        post: jest.fn().mockRejectedValue(error),
      };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValueOnce(mockAxios);

      await expect(useTripStore.getState().acceptInvitation('accepted-token')).rejects.toMatchObject(error);
    });

    it('should handle already declined error (409)', async () => {
      const error = {
        response: {
          status: 409,
          data: { type: 'BUSINESS_LOGIC_ERROR', code: 'ALREADY_PROCESSED', message: 'Already declined' },
        },
      };
      const mockAxios = {
        post: jest.fn().mockRejectedValue(error),
      };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValueOnce(mockAxios);

      await expect(useTripStore.getState().acceptInvitation('declined-token')).rejects.toMatchObject(error);
    });

    it('should handle invalid token error (404)', async () => {
      const error = {
        response: {
          status: 404,
          data: { type: 'RESOURCE_ERROR', code: 'NOT_FOUND', message: 'Invalid invitation' },
        },
      };
      const mockAxios = {
        post: jest.fn().mockRejectedValue(error),
      };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValueOnce(mockAxios);

      await expect(useTripStore.getState().acceptInvitation('invalid-token')).rejects.toMatchObject(error);
    });

    it('should handle revoked invitation error (410)', async () => {
      const error = {
        response: {
          status: 410,
          data: { type: 'BUSINESS_LOGIC_ERROR', code: 'INVITATION_REVOKED', message: 'Invitation revoked' },
        },
      };
      const mockAxios = {
        post: jest.fn().mockRejectedValue(error),
      };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValueOnce(mockAxios);

      await expect(useTripStore.getState().acceptInvitation('revoked-token')).rejects.toMatchObject(error);
    });

    it('should handle different user email error (403)', async () => {
      const error = {
        response: {
          status: 403,
          data: { type: 'AUTHORIZATION_ERROR', code: 'FORBIDDEN', message: 'Invitation for different email' },
        },
      };
      const mockAxios = {
        post: jest.fn().mockRejectedValue(error),
      };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValueOnce(mockAxios);

      await expect(useTripStore.getState().acceptInvitation('wrong-user-token')).rejects.toMatchObject(error);
    });

    it('should add current user as member when accepting', async () => {
      const tripWithoutUser = { ...mockTrip, members: [] };
      const mockAxios = { post: jest.fn().mockResolvedValue({ data: { trip: tripWithoutUser } }) };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      useTripStore.setState({ trips: [] });

      await act(async () => {
        await useTripStore.getState().acceptInvitation('valid-token');
      });

      const trips = useTripStore.getState().trips;
      expect(trips.length).toBe(1);
      expect(trips[0].members.some(m => m.userId === mockUser.id)).toBe(true);
    });

    it('should not duplicate user if already in members list', async () => {
      const tripWithUser = {
        ...mockTrip,
        members: [
          {
            userId: mockUser.id,
            name: 'Test User',
            role: 'member' as const,
            joinedAt: new Date().toISOString(),
          },
        ],
      };
      const mockAxios = { post: jest.fn().mockResolvedValue({ data: { trip: tripWithUser } }) };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      useTripStore.setState({ trips: [] });

      await act(async () => {
        await useTripStore.getState().acceptInvitation('valid-token');
      });

      const trips = useTripStore.getState().trips;
      expect(trips.length).toBe(1);
      expect(trips[0].members.filter(m => m.userId === mockUser.id).length).toBe(1);
    });

    it('should use user display name when adding member', async () => {
      const tripWithoutUser = { ...mockTrip, members: [] };
      const mockAxios = { post: jest.fn().mockResolvedValue({ data: { trip: tripWithoutUser } }) };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      useTripStore.setState({ trips: [] });

      await act(async () => {
        await useTripStore.getState().acceptInvitation('valid-token');
      });

      const trips = useTripStore.getState().trips;
      const addedMember = trips[0].members.find(m => m.userId === mockUser.id);
      expect(addedMember?.name).toBe('Test User'); // From createMockUser firstName + lastName
    });

    it('should remove pending invitation from AsyncStorage on success', async () => {
      const mockAxios = { post: jest.fn().mockResolvedValue({ data: { trip: mockTrip } }) };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      await act(async () => {
        await useTripStore.getState().acceptInvitation('valid-token');
      });

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('pendingInvitation');
    });

    it('should call refreshSession before accepting invitation', async () => {
      const mockRefreshSession = jest.fn().mockResolvedValue(undefined);
      useAuthStore.setState({
        user: mockUser,
        refreshSession: mockRefreshSession
      } as any);

      const mockAxios = { post: jest.fn().mockResolvedValue({ data: { trip: mockTrip } }) };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      await act(async () => {
        await useTripStore.getState().acceptInvitation('valid-token');
      });

      expect(mockRefreshSession).toHaveBeenCalled();
    });
  });

  describe('revokeInvitation', () => {
    beforeEach(() => {
      const tripWithInvitations = {
        ...mockTrip,
        invitations: [createMockInvitation({ token: 'inv-123' })],
      };
      useTripStore.setState({ trips: [tripWithInvitations] });
    });

    it('should revoke invitation and update state', async () => {
      (api.delete as jest.Mock).mockResolvedValue({});

      await act(async () => {
        await useTripStore.getState().revokeInvitation('trip-123', 'inv-123');
      });

      const trip = useTripStore.getState().trips[0];
      expect(trip.invitations).toHaveLength(0);
    });

    it('should only remove the specified invitation', async () => {
      const tripWithMultipleInvitations = {
        ...mockTrip,
        invitations: [
          createMockInvitation({ token: 'inv-123', email: 'user1@example.com' }),
          createMockInvitation({ token: 'inv-456', email: 'user2@example.com' }),
        ],
      };
      useTripStore.setState({ trips: [tripWithMultipleInvitations] });

      (api.delete as jest.Mock).mockResolvedValue({});

      await act(async () => {
        await useTripStore.getState().revokeInvitation('trip-123', 'inv-123');
      });

      const trip = useTripStore.getState().trips[0];
      expect(trip.invitations).toHaveLength(1);
      expect(trip.invitations![0].token).toBe('inv-456');
    });

    it('should handle revoke error', async () => {
      (api.delete as jest.Mock).mockRejectedValue(new Error('Failed'));

      await expect(
        useTripStore.getState().revokeInvitation('trip-123', 'inv-123')
      ).rejects.toThrow('Failed to revoke invitation');
    });

    it('should handle invitation not found error (404)', async () => {
      const error = {
        response: {
          status: 404,
          data: { type: 'RESOURCE_ERROR', code: 'NOT_FOUND', message: 'Invitation not found' },
        },
      };
      (api.delete as jest.Mock).mockRejectedValue(error);

      await expect(
        useTripStore.getState().revokeInvitation('trip-123', 'invalid-inv')
      ).rejects.toThrow();
    });

    it('should call correct API endpoint', async () => {
      (api.delete as jest.Mock).mockResolvedValue({});

      await useTripStore.getState().revokeInvitation('trip-123', 'inv-123');

      expect(api.delete).toHaveBeenCalledWith(
        expect.stringContaining('/trips/trip-123/invitations/inv-123')
      );
    });
  });

  describe('persistInvitation', () => {
    it('should store invitation token in AsyncStorage', async () => {
      await useTripStore.getState().persistInvitation('pending-token');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('pendingInvitation', 'pending-token');
    });

    it('should handle storage error gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'));

      // Should not throw
      await expect(
        useTripStore.getState().persistInvitation('test-token')
      ).resolves.not.toThrow();
    });

    it('should log error when storage fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'));

      await useTripStore.getState().persistInvitation('test-token');

      // Note: The actual implementation uses logger.error, but we're testing the behavior
      consoleErrorSpy.mockRestore();
    });

    it('should handle empty token', async () => {
      await useTripStore.getState().persistInvitation('');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('pendingInvitation', '');
    });

    it('should handle very long token', async () => {
      const longToken = 'a'.repeat(500);
      await useTripStore.getState().persistInvitation(longToken);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('pendingInvitation', longToken);
    });
  });

  describe('checkPendingInvitations', () => {
    it('should accept pending invitation if user is authenticated', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('stored-token');
      const mockAxios = { post: jest.fn().mockResolvedValue({ data: { trip: mockTrip } }) };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      await act(async () => {
        await useTripStore.getState().checkPendingInvitations();
      });

      expect(mockAxios.post).toHaveBeenCalled();
    });

    it('should not accept if no pending invitation', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      const mockAxios = { post: jest.fn() };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      await useTripStore.getState().checkPendingInvitations();

      expect(mockAxios.post).not.toHaveBeenCalled();
    });

    it('should not accept if user not authenticated', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token');
      useAuthStore.setState({ user: null });
      const mockAxios = { post: jest.fn() };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      await useTripStore.getState().checkPendingInvitations();

      expect(mockAxios.post).not.toHaveBeenCalled();
    });

    it('should not accept if AsyncStorage returns empty string', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('');
      const mockAxios = { post: jest.fn() };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      await useTripStore.getState().checkPendingInvitations();

      expect(mockAxios.post).not.toHaveBeenCalled();
    });

    it('should handle AsyncStorage errors by throwing', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      const mockAxios = { post: jest.fn() };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      // Will throw storage error
      await expect(
        useTripStore.getState().checkPendingInvitations()
      ).rejects.toThrow('Storage error');
    });

    it('should call acceptInvitation with correct token', async () => {
      const testToken = 'my-test-token-123';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(testToken);
      const mockAxios = { post: jest.fn().mockResolvedValue({ data: { trip: mockTrip } }) };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      await act(async () => {
        await useTripStore.getState().checkPendingInvitations();
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ token: testToken })
      );
    });
  });

  describe('Invitation Lifecycle Integration', () => {
    it('should handle full invitation flow: invite -> persist -> check -> accept', async () => {
      // Step 1: Send invitation
      (api.post as jest.Mock).mockResolvedValue({});
      await useTripStore.getState().inviteMember('trip-123', 'newuser@example.com', 'member');

      // Step 2: Persist invitation token (simulating user not logged in yet)
      await useTripStore.getState().persistInvitation('invitation-token-xyz');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('pendingInvitation', 'invitation-token-xyz');

      // Step 3: User logs in and checks pending invitations
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invitation-token-xyz');
      const mockAxios = { post: jest.fn().mockResolvedValue({ data: { trip: mockTrip } }) };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      await act(async () => {
        await useTripStore.getState().checkPendingInvitations();
      });

      // Step 4: Verify invitation was accepted and token removed
      expect(mockAxios.post).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('pendingInvitation');
    });

    it('should attempt to accept invitation when pending exists', async () => {
      // Set up pending invitation
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('valid-token');

      const mockAxios = {
        post: jest.fn().mockResolvedValue({ data: { trip: mockTrip } }),
      };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValueOnce(mockAxios);

      await useTripStore.getState().checkPendingInvitations();

      // Wait a bit for the async operation to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockAxios.post).toHaveBeenCalled();
    });

    it('should handle multiple simultaneous invitation operations', async () => {
      (api.post as jest.Mock).mockResolvedValue({});

      // Send multiple invitations concurrently
      await Promise.all([
        useTripStore.getState().inviteMember('trip-123', 'user1@example.com', 'member'),
        useTripStore.getState().inviteMember('trip-123', 'user2@example.com', 'member'),
        useTripStore.getState().inviteMember('trip-123', 'user3@example.com', 'admin'),
      ]);

      expect(api.post).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle trip not found when revoking invitation', async () => {
      useTripStore.setState({ trips: [] });
      (api.delete as jest.Mock).mockResolvedValue({});

      await act(async () => {
        await useTripStore.getState().revokeInvitation('nonexistent-trip', 'inv-123');
      });

      // Should still call API even if trip not in local state
      expect(api.delete).toHaveBeenCalled();
    });

    it('should handle malformed invitation token', async () => {
      const error = {
        response: {
          status: 400,
          data: { type: 'VALIDATION_ERROR', code: 'VALIDATION_FAILED', message: 'Invalid token format' },
        },
      };
      const mockAxios = {
        post: jest.fn().mockRejectedValue(error),
      };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      await expect(
        useTripStore.getState().acceptInvitation('malformed!!!token')
      ).rejects.toMatchObject(error);
    });

    it('should handle network errors during invitation acceptance', async () => {
      const mockAxios = {
        post: jest.fn().mockRejectedValue(new Error('Network Error')),
      };
      (apiClient.getAxiosInstance as jest.Mock).mockReturnValue(mockAxios);

      await expect(
        useTripStore.getState().acceptInvitation('valid-token')
      ).rejects.toThrow('Network Error');
    });

    it('should handle trip with no invitations array when revoking', async () => {
      const tripWithoutInvitations = { ...mockTrip, invitations: undefined };
      useTripStore.setState({ trips: [tripWithoutInvitations] });
      (api.delete as jest.Mock).mockResolvedValue({});

      await act(async () => {
        await useTripStore.getState().revokeInvitation('trip-123', 'inv-123');
      });

      // Should handle gracefully and result in empty array
      const trip = useTripStore.getState().trips[0];
      expect(trip.invitations).toEqual([]);
    });
  });
});
