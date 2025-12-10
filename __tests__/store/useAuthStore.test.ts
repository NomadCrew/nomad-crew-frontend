/**
 * @jest-environment jsdom
 */

import type { Session as SupabaseSession } from '@supabase/supabase-js';

import { supabase } from '@/src/auth/supabaseClient';
import { useAuthStore } from '@/src/store/useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { api } from '@/src/api/api-client';

// Mock Supabase
jest.mock('@/src/auth/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithIdToken: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
    },
  },
}));

// Mock dependencies
jest.mock('@/src/api/api-client', () => ({
  registerAuthHandlers: jest.fn(),
  api: {
    post: jest.fn(),
  },
}));

jest.mock('@/src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/src/api/auth-api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the store to initial state
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
            avatar_url: 'https://example.com/avatar.jpg'
          }
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
      const mockSession = {
        user: {
          id: 'user-456',
          email: 'minimal@example.com',
          user_metadata: {}
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
      (supabase.auth.getSession as jest.Mock).mockRejectedValue(
        new Error('Network failure')
      );

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().isInitialized).toBe(true);
    });
  });

  describe('register', () => {
    it('should register user successfully and set isVerifying', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: {
          user: { id: 'new-user' },
          session: null // Email verification required
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
      expect(state.isVerifying).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            username: 'newuser',
            firstName: 'New',
            lastName: 'User',
          }
        }
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
      expect(state.isVerifying).toBe(false);
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
          }
        }
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
    it('should login successfully and set user state', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            avatar_url: 'https://example.com/avatar.jpg'
          }
        },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
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
      expect(state.isVerifying).toBe(false);
    });

    it('should handle invalid credentials error', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      });

      await useAuthStore.getState().login({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        });

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

      await expect(
        useAuthStore.getState().login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('No session returned during login');

      expect(useAuthStore.getState().loading).toBe(false);
    });

    it('should handle missing email in session', async () => {
      const mockSession = {
        user: {
          id: 'user-789',
          email: null,
          user_metadata: { username: 'nomail' }
        },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
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
            username: 'testuser'
          }
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

    it('should clear auth state when no refresh token available', async () => {
      useAuthStore.setState({
        token: 'old-token',
        user: { id: '123', email: 'test@example.com', username: 'test' }
      });

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(
        useAuthStore.getState().refreshSession()
      ).rejects.toThrow('No refresh token available and session recovery failed.');

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

      await expect(
        useAuthStore.getState().refreshSession()
      ).rejects.toThrow();

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

      await expect(
        useAuthStore.getState().refreshSession()
      ).rejects.toThrow('Failed to refresh session - no session returned from Supabase');
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
        token: 'token'
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

    it('should clear AsyncStorage during logout', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      await useAuthStore.getState().logout();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'supabase.auth.token',
        'supabase.auth.refreshToken',
        'supabase.auth.user'
      ]);
    });

    it('should handle AsyncStorage clearing errors gracefully', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
      (AsyncStorage.multiRemove as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await useAuthStore.getState().logout();

      // Should still clear auth state
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should handle unexpected errors during logout', async () => {
      useAuthStore.setState({
        user: { id: '123', email: 'test@example.com', username: 'test' },
        token: 'token'
      });

      (supabase.auth.signOut as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      await useAuthStore.getState().logout();

      // Should still reset state
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().status).toBe('unauthenticated');
    });
  });

  describe('handleGoogleSignInSuccess', () => {
    it('should authenticate with Google ID token (direct format)', async () => {
      const mockSession = {
        user: {
          id: 'google-user',
          email: 'google@example.com',
          user_metadata: {
            username: 'googleuser',
            avatar_url: 'https://google.com/avatar.jpg'
          }
        },
        access_token: 'google-access-token',
        refresh_token: 'google-refresh-token',
      };

      (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      await useAuthStore.getState().handleGoogleSignInSuccess({
          idToken: 'google-id-token',
        });

      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('google-user');
      expect(state.user?.email).toBe('google@example.com');
      expect(state.token).toBe('google-access-token');
      expect(state.loading).toBe(false);
      expect(state.isVerifying).toBe(false);
      expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'google',
        token: 'google-id-token',
      });
    });

    it('should handle nested user format', async () => {
      const mockSession = {
        user: { id: 'google-user', email: 'google@example.com', user_metadata: {} },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      await useAuthStore.getState().handleGoogleSignInSuccess({
          user: { idToken: 'nested-id-token' }
        });

      expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'google',
        token: 'nested-id-token',
      });
    });

    it('should handle data wrapper format', async () => {
      const mockSession = {
        user: { id: 'google-user', email: 'google@example.com', user_metadata: {} },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      await useAuthStore.getState().handleGoogleSignInSuccess({
          data: { idToken: 'data-wrapped-token' }
        });

      expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'google',
        token: 'data-wrapped-token',
      });
    });

    it('should handle authentication wrapper format', async () => {
      const mockSession = {
        user: { id: 'google-user', email: 'google@example.com', user_metadata: {} },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      await useAuthStore.getState().handleGoogleSignInSuccess({
          authentication: { idToken: 'auth-wrapped-token' }
        });

      expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'google',
        token: 'auth-wrapped-token',
      });
    });

    it('should handle missing ID token', async () => {
      await expect(
        useAuthStore.getState().handleGoogleSignInSuccess({})
      ).rejects.toThrow('No ID token in response');

      const state = useAuthStore.getState();
      expect(state.error).toBe('No ID token in response');
      expect(state.loading).toBe(false);
    });

    it('should handle Supabase sign-in error', async () => {
      const mockError = { message: 'Invalid ID token' };
      (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      try {
        await useAuthStore.getState().handleGoogleSignInSuccess({
          idToken: 'invalid-token'
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('Invalid ID token');
      }

      expect(useAuthStore.getState().loading).toBe(false);
    });

    it('should handle missing session in response', async () => {
      (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(
        useAuthStore.getState().handleGoogleSignInSuccess({
          idToken: 'valid-token'
        })
      ).rejects.toThrow('No session returned from Google sign-in');
    });
  });

  describe('handleAppleSignInSuccess', () => {
    it('should authenticate with Apple session', async () => {
      const mockAppleSession: SupabaseSession = {
        user: {
          id: 'apple-user',
          email: 'apple@example.com',
          user_metadata: {
            username: 'appleuser',
            firstName: 'Apple',
            lastName: 'User',
            avatar_url: 'https://apple.com/avatar.jpg'
          },
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
        },
        access_token: 'apple-access-token',
        refresh_token: 'apple-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      };

      await useAuthStore.getState().handleAppleSignInSuccess(mockAppleSession);

      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('apple-user');
      expect(state.user?.email).toBe('apple@example.com');
      expect(state.user?.username).toBe('appleuser');
      expect(state.user?.appleUser).toBe(true);
      expect(state.token).toBe('apple-access-token');
      expect(state.refreshToken).toBe('apple-refresh-token');
      expect(state.loading).toBe(false);
      expect(state.isVerifying).toBe(false);
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

      await useAuthStore.getState().handleAppleSignInSuccess(mockAppleSession);

      const state = useAuthStore.getState();
      expect(state.user?.email).toBe('');
      expect(state.user?.username).toBe('');
      expect(state.user?.appleUser).toBe(true);
    });

    it('should handle errors during Apple sign-in', async () => {
      // Simulate an error by passing invalid data
      const invalidSession = null as any;

      await expect(
        useAuthStore.getState().handleAppleSignInSuccess(invalidSession)
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
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

      (api.post as jest.Mock).mockResolvedValue({});

      await useAuthStore.getState().registerPushToken();

      const state = useAuthStore.getState();
      expect(state.pushToken).toBe('ExponentPushToken[xxxxxx]');
      expect(api.post).toHaveBeenCalledWith('/users/push-token', {
        token: 'ExponentPushToken[xxxxxx]',
      });
    });

    it('should not register push token when permission not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      await useAuthStore.getState().registerPushToken();

      expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
      expect(api.post).not.toHaveBeenCalled();
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

      expect(api.post).not.toHaveBeenCalled();
      expect(useAuthStore.getState().pushToken).toBe('ExponentPushToken[xxxxxx]');
    });
  });

  describe('edge cases and error handling', () => {
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
    it('should maintain consistent state during failed operations', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Server error' },
      });

      await useAuthStore.getState().login({
          email: 'test@example.com',
          password: 'password123',
        });

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

      await useAuthStore.getState().login({
          email: 'wrong@example.com',
          password: 'wrong',
        });

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
