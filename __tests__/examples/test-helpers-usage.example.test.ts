/**
 * Test Helpers Usage Examples
 *
 * This file demonstrates how to use all the test helpers, factories, and mocks.
 * Use these patterns in your own tests for consistent, maintainable test code.
 */

// Mock Supabase auth service BEFORE importing anything that depends on it
jest.mock('@/src/features/auth/service', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithIdToken: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
    },
  },
}));

// Mock the supabase module
jest.mock('@/src/api/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithIdToken: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
    },
  },
}));

// Mock API client
jest.mock('@/src/api/api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  registerAuthHandlers: jest.fn(),
  getCurrentUserProfile: jest.fn(),
  onboardUser: jest.fn(),
  updateContactEmail: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { api } from '@/src/api/api-client';
import { supabase } from '@/src/api/supabase';
import { useAuthStore } from '@/src/features/auth/store';
import { useTripStore } from '@/src/features/trips/store';

// Import factories
import {
  createMockUser,
  createMockAppleUser,
  createMockTrip,
  createMockTripWithMembers,
  createMockMember,
  createMockInvitation,
} from '@/__tests__/factories';

// Import mocks
import {
  createSupabaseMock,
  createMockSession,
  mockSuccessfulSignIn,
  mockAuthError,
} from '@/__tests__/mocks/supabase.mock';

import { VALIDATION_ERROR, AUTH_ERROR, COMMON_AUTH_ERRORS } from '@/__tests__/mocks/api-responses';

// Import helpers
import {
  resetAllStores,
  setupAuthenticatedUser,
  setupUnauthenticatedUser,
  getAuthState,
  getTripState,
} from '@/__tests__/helpers/store-helpers';

import { mockApiSuccess, mockApiError, createMockAxios } from '@/__tests__/helpers/api-helpers';

describe('Test Helpers Usage Examples', () => {
  beforeEach(() => {
    // Reset all stores before each test
    resetAllStores();
    jest.clearAllMocks();
  });

  describe('Factory Usage Examples', () => {
    it('creates mock users with defaults', () => {
      const user = createMockUser();

      expect(user.id).toBe('user-123');
      expect(user.email).toBe('test@example.com');
      expect(user.username).toBe('testuser');
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
    });

    it('creates mock users with overrides', () => {
      const customUser = createMockUser({
        email: 'custom@example.com',
        firstName: 'Custom',
        lastName: 'User',
      });

      expect(customUser.email).toBe('custom@example.com');
      expect(customUser.firstName).toBe('Custom');
      expect(customUser.lastName).toBe('User');
    });

    it('creates Apple users', () => {
      const appleUser = createMockAppleUser();

      expect(appleUser.appleUser).toBe(true);
      expect(appleUser.email).toContain('appleid.com');
    });

    it('creates mock trips', () => {
      const trip = createMockTrip();

      expect(trip.id).toBe('trip-123');
      expect(trip.name).toBe('Test Trip');
      expect(trip.status).toBe('PLANNING');
      expect(trip.destination.address).toBe('Paris, France');
    });

    it('creates trips with members', () => {
      const trip = createMockTripWithMembers(3);

      expect(trip.members).toHaveLength(4); // owner + 3 members
      expect(trip.members?.[0].role).toBe('owner');
      expect(trip.members?.[1].role).toBe('member');
    });

    it('creates individual members', () => {
      const member = createMockMember({
        userId: 'custom-user-id',
        role: 'admin',
      });

      expect(member.userId).toBe('custom-user-id');
      expect(member.role).toBe('admin');
    });

    it('creates invitations', () => {
      const invitation = createMockInvitation({
        email: 'invitee@example.com',
        status: 'pending',
      });

      expect(invitation.email).toBe('invitee@example.com');
      expect(invitation.status).toBe('pending');
    });
  });

  describe('Store Helper Usage Examples', () => {
    it('sets up authenticated user', () => {
      const user = createMockUser();
      setupAuthenticatedUser(user, 'test-token');

      const authState = getAuthState();
      expect(authState.user).toEqual(user);
      expect(authState.token).toBe('test-token');
      expect(authState.status).toBe('authenticated');
      expect(authState.isInitialized).toBe(true);
    });

    it('sets up unauthenticated user', () => {
      setupUnauthenticatedUser();

      const authState = getAuthState();
      expect(authState.user).toBeNull();
      expect(authState.token).toBeNull();
      expect(authState.status).toBe('unauthenticated');
    });

    it('resets all stores', () => {
      // Set up some state
      setupAuthenticatedUser(createMockUser());
      useTripStore.setState({ trips: [createMockTrip()] });

      // Reset
      resetAllStores();

      const authState = getAuthState();
      const tripState = getTripState();

      expect(authState.user).toBeNull();
      expect(tripState.trips).toHaveLength(0);
    });
  });

  describe('API Mock Usage Examples', () => {
    it('mocks successful API response', async () => {
      const mockTrips = [createMockTrip(), createMockTrip({ id: 'trip-456' })];
      jest.spyOn(api, 'get').mockImplementation(() => mockApiSuccess({ trips: mockTrips }));

      const response = await api.get('/trips');

      expect(response.data.trips).toEqual(mockTrips);
      expect(response.status).toBe(200);
    });

    it('mocks API error response', async () => {
      const errorResponse = VALIDATION_ERROR({
        email: 'Invalid email format',
      });

      jest.spyOn(api, 'post').mockImplementation(() => mockApiError(400, errorResponse));

      await expect(api.post('/auth/register', {})).rejects.toMatchObject({
        response: {
          status: 400,
          data: errorResponse,
        },
      });
    });

    it('mocks common auth errors', async () => {
      jest
        .spyOn(api, 'post')
        .mockImplementation(() => mockApiError(401, COMMON_AUTH_ERRORS.INVALID_CREDENTIALS));

      await expect(api.post('/auth/login', {})).rejects.toMatchObject({
        response: {
          status: 401,
        },
      });
    });
  });

  describe('Supabase Mock Usage Examples', () => {
    it('mocks successful sign in', async () => {
      const session = createMockSession();
      const mockSupabase = supabase as jest.Mocked<typeof supabase>;

      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockSuccessfulSignIn(session));

      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.data.session).toEqual(session);
      expect(result.error).toBeNull();
    });

    it('mocks auth error', async () => {
      const mockSupabase = supabase as jest.Mocked<typeof supabase>;

      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockAuthError('Invalid credentials'));

      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrong',
      });

      expect(result.data.session).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid credentials');
    });

    it('mocks custom session', async () => {
      const customSession = createMockSession({
        user: {
          email: 'custom@example.com',
          user_metadata: {
            username: 'customuser',
          },
        } as any,
      });

      const mockSupabase = supabase as jest.Mocked<typeof supabase>;

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: customSession },
        error: null,
      });

      const result = await supabase.auth.getSession();

      expect(result.data.session?.user.email).toBe('custom@example.com');
    });
  });

  describe('Integration Test Example', () => {
    it('tests complete login flow with mocks', async () => {
      // Setup: User is not authenticated
      setupUnauthenticatedUser();

      // Mock Supabase sign-in - must use the service module's supabase
      // since that's what the auth store actually imports
      const { supabase: authSupabase } = require('@/src/features/auth/service');
      const { getCurrentUserProfile } = require('@/src/api/api-client');

      const mockUser = createMockUser({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      });

      const session = createMockSession({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
          },
        } as any,
      });

      authSupabase.auth.signInWithPassword.mockResolvedValue(mockSuccessfulSignIn(session));

      // Mock the getCurrentUserProfile function to return the mock user
      getCurrentUserProfile.mockResolvedValue(mockUser);

      // Execute: Login
      await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password',
      });

      // Assert: User is authenticated
      const authState = getAuthState();
      expect(authState.user).toBeDefined();
      expect(authState.user?.email).toBe('test@example.com');
      expect(authState.status).toBe('authenticated');
      expect(authState.loading).toBe(false);
    });

    it('tests fetching trips with authenticated user', async () => {
      // Setup: Authenticated user
      const user = createMockUser();
      setupAuthenticatedUser(user);

      // Mock API response
      const mockTrips = [
        createMockTrip(),
        createMockTrip({ id: 'trip-456', name: 'Another Trip' }),
      ];

      jest.spyOn(api, 'get').mockImplementation(() => mockApiSuccess(mockTrips));

      // Execute: Fetch trips
      await useTripStore.getState().fetchTrips();

      // Assert: Trips are loaded
      const tripState = getTripState();
      expect(tripState.trips).toHaveLength(2);
      expect(tripState.loading).toBe(false);
      expect(tripState.error).toBeNull();
    });
  });
});
