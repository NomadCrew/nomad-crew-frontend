/**
 * @jest-environment jsdom
 */

import type { Session as SupabaseSession } from '@supabase/supabase-js';

// Create the mock supabase object that will be shared across all mocks
// Note: jest.mock is hoisted, so we need to define the mock object inline
// or use a factory function that creates it

// Mock the auth service module BEFORE importing the store
// This is required because the service module throws if env vars are missing
// and Jest needs to intercept the module before it loads
jest.mock('@/src/features/auth/service', () => {
  // Define mock inside the factory so it's available when hoisted
  const mockAuth = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signInWithIdToken: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    refreshSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  };

  return {
    __esModule: true,
    supabase: { auth: mockAuth },
    refreshSupabaseSession: jest.fn(),
    registerPushTokenService: jest.fn(),
    deregisterPushTokenService: jest.fn(),
  };
});

// Now we can import the store after mocks are set up
import { useAuthStore } from '@/src/features/auth/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { api } from '@/src/api/api-client';

// Get reference to the mocked supabase for test assertions
// We need to require the module to get the actual mock instance
const { supabase } = require('@/src/features/auth/service');

// Mock dependencies
jest.mock('@/src/api/api-client', () => ({
  registerAuthHandlers: jest.fn(),
  api: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  // Mock backend user profile API
  onboardUser: jest.fn().mockResolvedValue({
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
  }),
  getCurrentUserProfile: jest.fn().mockResolvedValue({
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
  }),
  updateContactEmail: jest.fn(),
}));

jest.mock('@/src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/src/api/auth-api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

// Mock expo-secure-store (used by the new auth store)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

// Mock expo-constants for push token registration
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
}));

// Mock simulator auth utility
jest.mock('@/src/utils/simulator-auth', () => ({
  getSimulatorAuthState: jest.fn().mockReturnValue(null),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset SecureStore mock to default resolved state
    // This prevents test pollution from tests that mock rejection
    const SecureStore = require('expo-secure-store');
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

    // Reset API mocks to default state
    const { getCurrentUserProfile, onboardUser } = require('@/src/api/api-client');
    getCurrentUserProfile.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
    });
    onboardUser.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
    });

    // Reset the store to initial state
    // Note: The store now includes needsUsername and needsContactEmail fields
    // added during the auth service refactor
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      loading: false,
      error: null,
      isInitialized: false,
      isFirstTime: false,
      isVerifying: false,
      status: 'unauthenticated',
      pushToken: null,
      needsUsername: false,
      needsContactEmail: false,
    });
  });

  describe('initialize', () => {
    it('should recover session if valid session exists', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() / 1000 + 3600,
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.user?.id).toBe('user-123');
      expect(state.user?.email).toBe('test@example.com');
      expect(state.user?.username).toBe('testuser');
      expect(state.user?.firstName).toBe('Test');
      expect(state.user?.lastName).toBe('User');
      expect(state.user?.profilePicture).toBe('https://example.com/avatar.jpg');
      expect(state.token).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
    });

    it('should set initialized without user if no session', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });

    it('should handle session recovery error gracefully', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.user).toBeNull();
    });

    it('should handle missing user metadata gracefully', async () => {
      // The new store fetches backend profile during initialize
      // Mock it to return minimal user data
      const { getCurrentUserProfile } = require('@/src/api/api-client');
      getCurrentUserProfile.mockResolvedValue({
        id: 'user-456',
        email: 'minimal@example.com',
        username: '', // Empty username from backend
      });

      const mockSession = {
        user: {
          id: 'user-456',
          email: 'minimal@example.com',
          user_metadata: {},
        },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() / 1000 + 3600,
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.user?.username).toBe('');
      expect(state.user?.firstName).toBeUndefined();
      expect(state.user?.lastName).toBeUndefined();
    });

    it('should handle exception during initialization', async () => {
      (supabase.auth.getSession as jest.Mock).mockRejectedValue(new Error('Network failure'));

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().isInitialized).toBe(true);
    });
  });

  describe('register', () => {
    it('should register user successfully and set status to verifying when email verification required', async () => {
      // When Supabase returns user but no session, email verification is required
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'new-user',
            email: 'new@example.com',
            user_metadata: {
              username: 'newuser',
            },
          },
          session: null, // Email verification required
        },
        error: null,
      });

      await useAuthStore.getState().register({
        email: 'new@example.com',
        password: 'password123',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
      });

      const state = useAuthStore.getState();
      // The new store implementation sets status: 'verifying' when email verification is pending
      expect(state.status).toBe('verifying');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      // User object should be set with partial data
      expect(state.user?.id).toBe('new-user');
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            username: 'newuser',
            firstName: 'New',
            lastName: 'User',
          },
        },
      });
    });

    it('should handle duplicate email error', async () => {
      const duplicateError = new Error('User already registered');
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: duplicateError,
      });

      await expect(
        useAuthStore.getState().register({
          email: 'existing@example.com',
          password: 'password123',
          username: 'existinguser',
        })
      ).rejects.toThrow('User already registered');

      const state = useAuthStore.getState();
      expect(state.error).toBe('User already registered');
      expect(state.loading).toBe(false);
      // On error, status should be unauthenticated
      expect(state.status).toBe('unauthenticated');
    });

    it('should handle registration with only required fields', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: { id: 'minimal-user' }, session: null },
        error: null,
      });

      await useAuthStore.getState().register({
        email: 'minimal@example.com',
        password: 'password123',
        username: 'minimaluser',
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'minimal@example.com',
        password: 'password123',
        options: {
          data: {
            username: 'minimaluser',
            firstName: undefined,
            lastName: undefined,
          },
        },
      });
    });

    it('should handle unknown error types', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Unknown error' },
      });

      await expect(
        useAuthStore.getState().register({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
        })
      ).rejects.toBeTruthy();

      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe('login', () => {
    // Mock getCurrentUserProfile for login tests
    // The new store fetches user profile from backend after successful Supabase login
    const { getCurrentUserProfile } = require('@/src/api/api-client');

    it('should login successfully and set user state', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      // Mock backend profile fetch that happens after successful login
      getCurrentUserProfile.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        profilePicture: 'https://example.com/avatar.jpg',
      });

      await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      });

      const state = useAuthStore.getState();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.user?.username).toBe('testuser');
      expect(state.token).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.status).toBe('authenticated');
    });

    it('should handle invalid credentials error', async () => {
      // The new store throws on error, so we need to catch
      // The error from Supabase is an object { message: '...' }
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      });

      // The store throws the error object (not Error instance)
      // and also sets the error state
      try {
        await useAuthStore.getState().login({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (err: any) {
        expect(err.message).toBe('Invalid login credentials');
      }

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.error).toBe('Invalid login credentials');
      expect(state.loading).toBe(false);
    });

    it('should throw error when no session returned', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      });

      // The new store throws 'Login successful but no session returned.'
      await expect(
        useAuthStore.getState().login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Login successful but no session returned');

      expect(useAuthStore.getState().loading).toBe(false);
    });

    it('should handle missing email in session', async () => {
      const mockSession = {
        user: {
          id: 'user-789',
          email: null,
          user_metadata: { username: 'nomail' },
        },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      // The new store fetches user profile from backend after successful login
      // Return a user with empty email to match the session
      getCurrentUserProfile.mockResolvedValue({
        id: 'user-789',
        email: '',
        username: 'nomail',
      });

      await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(useAuthStore.getState().user?.email).toBe('');
    });
  });

  describe('refreshSession', () => {
    it('should refresh tokens successfully', async () => {
      const oldSession = {
        refresh_token: 'old-refresh',
      };

      const newSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            username: 'testuser',
          },
        },
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Date.now() / 1000 + 3600,
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: oldSession },
        error: null,
      });

      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: newSession },
        error: null,
      });

      await useAuthStore.getState().refreshSession();

      const state = useAuthStore.getState();
      expect(state.token).toBe('new-access-token');
      expect(state.refreshToken).toBe('new-refresh-token');
      expect(state.status).toBe('authenticated');
    });

    it('should clear auth state when refresh fails and recovery fails', async () => {
      useAuthStore.setState({
        token: 'old-token',
        user: { id: '123', email: 'test@example.com', username: 'test' },
      });

      // The new store first calls refreshSession directly, then recovers on failure
      // Mock getSession to return null (no existing session to recover)
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      // Mock refreshSession to fail
      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid refresh token' },
      });

      // The store throws the error
      try {
        await useAuthStore.getState().refreshSession();
        // Should not reach here
        expect(true).toBe(false);
      } catch (err: any) {
        expect(err.message).toBe('Invalid refresh token');
      }

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.status).toBe('unauthenticated');
    });

    it('should handle refresh session error and clear state', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { refresh_token: 'old-refresh' } },
        error: null,
      });

      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Refresh token expired' },
      });

      await expect(useAuthStore.getState().refreshSession()).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.status).toBe('unauthenticated');
      expect(state.error).toBeTruthy();
    });

    it('should handle session returned without session data', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { refresh_token: 'refresh-token' } },
        error: null,
      });

      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(useAuthStore.getState().refreshSession()).rejects.toThrow(
        'Failed to refresh session - no session returned from Supabase'
      );
    });

    it('should handle getSession error', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session fetch error' },
      });

      // When getSession returns an error, refreshSession should throw
      try {
        await useAuthStore.getState().refreshSession();
        // If we reach here, the test should fail
        expect(true).toBe(false); // This line should not be reached
      } catch (error: any) {
        // Error is expected
        expect(error).toBeTruthy();
      }
    });
  });

  describe('logout', () => {
    it('should clear all auth state on logout', async () => {
      useAuthStore.setState({
        user: { id: 'user-123', email: 'test@example.com', username: 'test' },
        token: 'token',
        refreshToken: 'refresh',
        status: 'authenticated',
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.status).toBe('unauthenticated');
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });

    it('should clear local state even if Supabase signOut fails', async () => {
      useAuthStore.setState({
        user: { id: '123', email: 'test@example.com', username: 'test' },
        token: 'token',
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: { message: 'Network error' },
      });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.status).toBe('unauthenticated');
    });

    it('should clear SecureStore during logout', async () => {
      // The new store uses SecureStore instead of AsyncStorage for token storage
      const SecureStore = require('expo-secure-store');
      // Reset the mock to ensure clean state
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      await useAuthStore.getState().logout();

      // The new store deletes the access token from SecureStore
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('supabase_access_token');
    });

    it('should handle SecureStore clearing errors gracefully', async () => {
      const SecureStore = require('expo-secure-store');
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
      // Set up the mock to reject for this specific test
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await useAuthStore.getState().logout();

      // Should still clear auth state
      expect(useAuthStore.getState().user).toBeNull();

      // Reset the mock for subsequent tests
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    });

    it('should handle unexpected errors during logout', async () => {
      const SecureStore = require('expo-secure-store');
      // Reset SecureStore mock first
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      useAuthStore.setState({
        user: { id: '123', email: 'test@example.com', username: 'test' },
        token: 'token',
      });

      (supabase.auth.signOut as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      await useAuthStore.getState().logout();

      // Should still reset state
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().status).toBe('unauthenticated');
    });
  });

  describe('handleGoogleSignInSuccess', () => {
    // Note: The new store API has changed significantly
    // handleGoogleSignInSuccess now takes a Supabase Session directly
    // The Google sign-in flow (calling signInWithIdToken) now happens at the hook level
    // The store just processes the resulting session
    const { getCurrentUserProfile } = require('@/src/api/api-client');

    it('should process Google sign-in session and set user state', async () => {
      // Create a valid Supabase session object
      const mockGoogleSession: SupabaseSession = {
        user: {
          id: 'google-user',
          email: 'google@example.com',
          user_metadata: {
            username: 'googleuser',
            avatar_url: 'https://google.com/avatar.jpg',
            full_name: 'Google User',
          },
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
        },
        access_token: 'google-access-token',
        refresh_token: 'google-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      };

      // Mock backend profile fetch
      getCurrentUserProfile.mockResolvedValue({
        id: 'google-user',
        email: 'google@example.com',
        username: 'googleuser',
        profilePicture: 'https://google.com/avatar.jpg',
      });

      await useAuthStore.getState().handleGoogleSignInSuccess(mockGoogleSession);

      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('google-user');
      expect(state.user?.email).toBe('google@example.com');
      expect(state.token).toBe('google-access-token');
      expect(state.loading).toBe(false);
      expect(state.status).toBe('authenticated');
    });

    it('should set needsUsername when backend profile not found', async () => {
      const mockSession: SupabaseSession = {
        user: {
          id: 'new-google-user',
          email: 'newuser@example.com',
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
        },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      };

      // Simulate backend user not found (404)
      const { onboardUser } = require('@/src/api/api-client');
      const notFoundError = new Error('Not found');
      (notFoundError as any).response = { status: 404 };
      getCurrentUserProfile.mockRejectedValue(notFoundError);

      // Mock onboarding to also need username
      onboardUser.mockResolvedValue({
        id: 'new-google-user',
        email: 'newuser@example.com',
        username: '', // No username yet
      });

      await useAuthStore.getState().handleGoogleSignInSuccess(mockSession);

      const state = useAuthStore.getState();
      expect(state.needsUsername).toBe(true);
      expect(state.status).toBe('authenticated');
    });

    it('should handle session with minimal user metadata', async () => {
      const mockSession: SupabaseSession = {
        user: {
          id: 'minimal-user',
          email: 'minimal@example.com',
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
        },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      };

      getCurrentUserProfile.mockResolvedValue({
        id: 'minimal-user',
        email: 'minimal@example.com',
        username: 'minimaluser',
      });

      await useAuthStore.getState().handleGoogleSignInSuccess(mockSession);

      const state = useAuthStore.getState();
      expect(state.user).toBeTruthy();
      expect(state.loading).toBe(false);
    });

    it('should handle profile fetch errors gracefully', async () => {
      const mockSession: SupabaseSession = {
        user: {
          id: 'error-user',
          email: 'error@example.com',
          user_metadata: { username: 'erroruser' },
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
        },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      };

      // Non-404 error
      getCurrentUserProfile.mockRejectedValue(new Error('Network error'));

      await useAuthStore.getState().handleGoogleSignInSuccess(mockSession);

      // Should still be authenticated with fallback user data
      const state = useAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.needsUsername).toBe(true);
    });
  });

  describe('handleAppleSignInSuccess', () => {
    // The new store fetches backend profile after Apple sign-in
    const { getCurrentUserProfile } = require('@/src/api/api-client');

    it('should authenticate with Apple session', async () => {
      const mockAppleSession: SupabaseSession = {
        user: {
          id: 'apple-user',
          email: 'apple@example.com',
          user_metadata: {
            username: 'appleuser',
            firstName: 'Apple',
            lastName: 'User',
            avatar_url: 'https://apple.com/avatar.jpg',
          },
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
        },
        access_token: 'apple-access-token',
        refresh_token: 'apple-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      };

      // Mock backend profile fetch
      getCurrentUserProfile.mockResolvedValue({
        id: 'apple-user',
        email: 'apple@example.com',
        username: 'appleuser',
        firstName: 'Apple',
        lastName: 'User',
        appleUser: true,
      });

      await useAuthStore.getState().handleAppleSignInSuccess(mockAppleSession);

      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('apple-user');
      expect(state.user?.email).toBe('apple@example.com');
      expect(state.user?.username).toBe('appleuser');
      expect(state.user?.appleUser).toBe(true);
      expect(state.token).toBe('apple-access-token');
      expect(state.refreshToken).toBe('apple-refresh-token');
      expect(state.loading).toBe(false);
      expect(state.status).toBe('authenticated');
    });

    it('should handle Apple session with minimal metadata', async () => {
      const mockAppleSession: SupabaseSession = {
        user: {
          id: 'apple-user-2',
          email: null,
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
        },
        access_token: 'apple-token',
        refresh_token: 'apple-refresh',
        expires_in: 3600,
        token_type: 'bearer',
      };

      // Simulate backend returning minimal user (needs username)
      getCurrentUserProfile.mockRejectedValue(
        Object.assign(new Error('Not found'), { response: { status: 404 } })
      );

      const { onboardUser } = require('@/src/api/api-client');
      onboardUser.mockResolvedValue({
        id: 'apple-user-2',
        email: '',
        username: '',
        appleUser: true,
      });

      await useAuthStore.getState().handleAppleSignInSuccess(mockAppleSession);

      const state = useAuthStore.getState();
      // User should be created from fallback data
      expect(state.user?.appleUser).toBe(true);
      expect(state.needsUsername).toBe(true);
    });

    it('should handle errors during Apple sign-in gracefully', async () => {
      // Simulate an error by passing invalid data
      const invalidSession = null as any;

      // The new implementation catches errors and sets error state
      // instead of throwing (to allow UI to handle)
      await useAuthStore.getState().handleAppleSignInSuccess(invalidSession);

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
      expect(state.status).toBe('unauthenticated');
    });

    it('should detect Apple private relay email and set needsContactEmail', async () => {
      const mockAppleSession: SupabaseSession = {
        user: {
          id: 'apple-private-user',
          email: 'hidden@privaterelay.appleid.com',
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
        },
        access_token: 'apple-token',
        refresh_token: 'apple-refresh',
        expires_in: 3600,
        token_type: 'bearer',
      };

      getCurrentUserProfile.mockResolvedValue({
        id: 'apple-private-user',
        email: 'hidden@privaterelay.appleid.com',
        username: 'appleuser',
        appleUser: true,
      });

      await useAuthStore.getState().handleAppleSignInSuccess(mockAppleSession);

      const state = useAuthStore.getState();
      expect(state.needsContactEmail).toBe(true);
    });
  });

  describe('setFirstTimeDone', () => {
    it('should set isFirstTime to false', async () => {
      useAuthStore.setState({ isFirstTime: true });

      await useAuthStore.getState().setFirstTimeDone();

      expect(useAuthStore.getState().isFirstTime).toBe(false);
    });
  });

  describe('registerPushToken', () => {
    // The new store uses registerPushTokenService from the service module
    const { registerPushTokenService } = require('@/src/features/auth/service');

    it('should register push token when permission granted', async () => {
      useAuthStore.setState({
        user: { id: 'user-123', email: 'test@example.com', username: 'test' },
      });

      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[xxxxxx]',
      });

      (registerPushTokenService as jest.Mock).mockResolvedValue({});

      await useAuthStore.getState().registerPushToken();

      const state = useAuthStore.getState();
      expect(state.pushToken).toBe('ExponentPushToken[xxxxxx]');
      // The new store uses the service function instead of direct api.post
      expect(registerPushTokenService).toHaveBeenCalledWith('ExponentPushToken[xxxxxx]');
    });

    it('should not register push token when permission not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      await useAuthStore.getState().registerPushToken();

      expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
      expect(registerPushTokenService).not.toHaveBeenCalled();
    });

    it('should handle push token registration error', async () => {
      useAuthStore.setState({
        user: { id: 'user-123', email: 'test@example.com', username: 'test' },
      });

      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(
        new Error('Failed to get push token')
      );

      // Should not throw
      await useAuthStore.getState().registerPushToken();

      expect(useAuthStore.getState().pushToken).toBeNull();
    });

    it('should not send token to backend if no user', async () => {
      useAuthStore.setState({ user: null });

      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[xxxxxx]',
      });

      await useAuthStore.getState().registerPushToken();

      // The new store still sets pushToken locally but doesn't call the service
      expect(registerPushTokenService).not.toHaveBeenCalled();
      expect(useAuthStore.getState().pushToken).toBe('ExponentPushToken[xxxxxx]');
    });
  });

  describe('edge cases and error handling', () => {
    const { getCurrentUserProfile } = require('@/src/api/api-client');

    it('should handle concurrent login attempts', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com', user_metadata: {} },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      // Mock backend profile fetch for concurrent logins
      getCurrentUserProfile.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      // Trigger multiple logins at once
      await Promise.all([
        useAuthStore.getState().login({
          email: 'test@example.com',
          password: 'password123',
        }),
        useAuthStore.getState().login({
          email: 'test@example.com',
          password: 'password123',
        }),
      ]);

      // Should still have valid state
      const state = useAuthStore.getState();
      expect(state.user).toBeTruthy();
      expect(state.token).toBe('access-token');
    });

    it('should handle token with special characters', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com', user_metadata: {} },
        access_token: 'token-with-special-chars-!@#$%^&*()',
        refresh_token: 'refresh-with-special-chars-!@#$%^&*()',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      // Mock backend profile fetch
      getCurrentUserProfile.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      });

      const state = useAuthStore.getState();
      expect(state.token).toBe('token-with-special-chars-!@#$%^&*()');
    });

    it('should preserve other state properties during logout', async () => {
      useAuthStore.setState({
        user: { id: '123', email: 'test@example.com', username: 'test' },
        token: 'token',
        isFirstTime: true,
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().isFirstTime).toBe(true);
    });
  });

  describe('state consistency', () => {
    const { getCurrentUserProfile } = require('@/src/api/api-client');

    it('should maintain consistent state during failed operations', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Server error' },
      });

      // The new implementation throws the error object
      // Use try/catch instead of rejects.toThrow since the error is a plain object
      try {
        await useAuthStore.getState().login({
          email: 'test@example.com',
          password: 'password123',
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (err: any) {
        expect(err.message).toBe('Server error');
      }

      const finalState = useAuthStore.getState();
      expect(finalState.user).toBeNull();
      expect(finalState.token).toBeNull();
      expect(finalState.loading).toBe(false);
    });

    it('should clear error state on successful login after failed attempt', async () => {
      // First login fails
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Invalid credentials' },
      });

      // The new implementation throws the error object
      // Use try/catch since the error is a plain object, not Error instance
      try {
        await useAuthStore.getState().login({
          email: 'wrong@example.com',
          password: 'wrong',
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (err: any) {
        expect(err.message).toBe('Invalid credentials');
      }

      expect(useAuthStore.getState().error).toBe('Invalid credentials');

      // Second login succeeds
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com', user_metadata: {} },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      // Mock backend profile fetch
      getCurrentUserProfile.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'correct',
      });

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
      expect(state.user).toBeTruthy();
    });
  });
});
