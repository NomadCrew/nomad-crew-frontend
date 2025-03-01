import { create } from 'zustand';
import { supabase } from '@/src/auth/supabaseClient';
import type { AuthState, LoginCredentials, RegisterCredentials, User, AuthStatus } from '@/src/types/auth';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/src/utils/logger';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { ERROR_CODES, ERROR_MESSAGES } from '@/src/api/constants';

/**
 * Attempt to recover a session from Supabase.
 */
const recoverSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    // If there's a session, return it
    if (session) {
      return session;
    }
  } catch (error) {
    console.error('[AuthStore] Session recovery failed:', error);
  }
  return null;
};

export const useAuthStore = create<AuthState>((set, get) => {
  // State for user, token, loading, etc.
  return {
    user: null,
    token: null,
    loading: false,
    error: null,
    isInitialized: false,
    isFirstTime: false,
    isVerifying: false,
    status: 'unauthenticated' as AuthStatus,
    refreshToken: null,

    /**
     * Called on app start to recover session
     */
    initialize: async () => {
      try {
        logger.debug('AUTH', 'Initializing auth store');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          logger.debug('AUTH', 'No valid session found');
          return set({ isInitialized: true });
        }

        logger.debug('AUTH', 'Session restored', {
          userId: session.user.id,
          expiresAt: session.expires_at
        });
        set({ 
          user: {
            id: session.user.id,
            email: session.user.email ?? '',
            username: session.user.user_metadata?.username ?? '',
            firstName: session.user.user_metadata?.firstName,
            lastName: session.user.user_metadata?.lastName,
            profilePicture: session.user.user_metadata?.avatar_url,
          },
          token: session.access_token,
          refreshToken: session.refresh_token,
          isInitialized: true
        });

      } catch (error) {
        logger.error('AUTH', 'Initialization error:', error);
        set({ isInitialized: true });
      }
    },

    /**
     * Refresh the authentication session
     * First tries to use the backend's refresh endpoint
     * Falls back to Supabase refresh if needed
     */
    refreshSession: async () => {
      try {
        logger.debug('AUTH', 'Refreshing session');
        
        // Get the current refresh token
        const refreshToken = get().refreshToken;
        
        if (!refreshToken) {
          logger.debug('AUTH', 'No refresh token available, attempting to recover session');
          // Try to recover session from Supabase
          const recoveredSession = await recoverSession();
          
          if (recoveredSession) {
            logger.debug('AUTH', 'Session recovered successfully from Supabase');
            const user: User = {
              id: recoveredSession.user.id,
              email: recoveredSession.user.email ?? '',
              username: recoveredSession.user.user_metadata?.username ?? '',
              firstName: recoveredSession.user.user_metadata?.firstName,
              lastName: recoveredSession.user.user_metadata?.lastName,
              profilePicture: recoveredSession.user.user_metadata?.avatar_url,
            };
            
            set({
              user,
              token: recoveredSession.access_token,
              refreshToken: recoveredSession.refresh_token,
              status: 'authenticated'
            });
            
            return;
          }
          
          // If no refresh token and no recovered session, we need to re-authenticate
          throw new Error('No refresh token available and session recovery failed');
        }
        
        // Try to refresh using the backend's refresh endpoint
        try {
          logger.debug('AUTH', 'Attempting to refresh token using backend endpoint');
          
          const response = await api.post(API_PATHS.auth.refresh, {
            refresh_token: refreshToken
          });
          
          const { access_token, refresh_token, expires_in } = response.data;
          
          if (!access_token || !refresh_token) {
            throw new Error('Invalid response from refresh endpoint');
          }
          
          logger.debug('AUTH', 'Token refreshed successfully via backend', {
            expiresIn: expires_in
          });
          
          // Keep the same user data but update tokens
          set({
            token: access_token,
            refreshToken: refresh_token,
            status: 'authenticated'
          });
          
          return;
        } catch (backendRefreshError: any) {
          // Check for specific error codes from the backend
          const errorData = backendRefreshError.response?.data;
          
          if (errorData?.code === ERROR_CODES.INVALID_REFRESH_TOKEN || 
              errorData?.login_required === true) {
            logger.error('AUTH', 'Refresh token is invalid or expired:', errorData);
            // Clear auth state and throw specific error
            set({
              user: null,
              token: null,
              refreshToken: null,
              status: 'unauthenticated'
            });
            throw new Error(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
          }
          
          // For other errors, try Supabase refresh as fallback
          logger.debug('AUTH', 'Backend refresh failed, falling back to Supabase:', backendRefreshError);
        }
        
        // Fallback to Supabase refresh
        logger.debug('AUTH', 'Attempting to refresh via Supabase');
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          logger.error('AUTH', 'Supabase session refresh error:', error);
          
          // If Supabase refresh fails, try one last attempt to recover session
          logger.debug('AUTH', 'Attempting to recover session as last resort');
          const recoveredSession = await recoverSession();
          
          if (recoveredSession) {
            logger.debug('AUTH', 'Session recovered successfully');
            const user: User = {
              id: recoveredSession.user.id,
              email: recoveredSession.user.email ?? '',
              username: recoveredSession.user.user_metadata?.username ?? '',
              firstName: recoveredSession.user.user_metadata?.firstName,
              lastName: recoveredSession.user.user_metadata?.lastName,
              profilePicture: recoveredSession.user.user_metadata?.avatar_url,
            };
            
            set({
              user,
              token: recoveredSession.access_token,
              refreshToken: recoveredSession.refresh_token,
              status: 'authenticated'
            });
            
            return;
          }
          
          // If all refresh attempts fail, clear auth state and throw error
          set({
            user: null,
            token: null,
            refreshToken: null,
            status: 'unauthenticated'
          });
          
          throw new Error(ERROR_MESSAGES.REFRESH_FAILED);
        }
    
        const { session } = data;
        if (session) {
          logger.debug('AUTH', 'Session refreshed successfully via Supabase', {
            userId: session.user.id,
            expiresAt: session.expires_at
          });
          
          const user: User = {
            id: session.user.id,
            email: session.user.email ?? '',
            username: session.user.user_metadata?.username ?? '',
            firstName: session.user.user_metadata?.firstName,
            lastName: session.user.user_metadata?.lastName,
            profilePicture: session.user.user_metadata?.avatar_url,
          };
    
          set({
            user,
            token: session.access_token,
            refreshToken: session.refresh_token,
            status: 'authenticated'
          });
    
        } else {
          throw new Error('Failed to refresh session - no session returned');
        }
      } catch (error: any) {
        logger.error('AUTH', 'Refresh session error:', error);
        // Clear auth state on critical errors
        set({
          user: null,
          token: null,
          refreshToken: null,
          status: 'unauthenticated'
        });
        throw error;
      }
    },

    /**
     * Basic registration via Supabase
     */
    register: async (credentials: RegisterCredentials) => {
      try {
        set({ loading: true, error: null });
        const { data, error } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: {
              username: credentials.username,
              firstName: credentials.firstName,
              lastName: credentials.lastName,
            }
          }
        });
        if (error) throw error;

        // If sign-up is successful but email not verified
        set({
          isVerifying: true,
          loading: false,
          error: null
        });
        return;
      } catch (error: any) {
        set({
          error: error.message,
          loading: false
        });
        throw error;
      }
    },

    /**
     * Basic login via Supabase
     */
    login: async (credentials: LoginCredentials) => {
      try {
        set({ loading: true, error: null });
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        if (error) {
          set({ loading: false, error: error.message });
          return;
        }
        if (!data.session) {
          throw new Error('No session returned during login');
        }
    
        // Build user from session
        const user: User = {
          id: data.session.user.id,
          email: data.session.user.email ?? '',
          username: data.session.user.user_metadata?.username ?? '',
          firstName: data.session.user.user_metadata?.firstName,
          lastName: data.session.user.user_metadata?.lastName,
          profilePicture: data.session.user.user_metadata?.avatar_url,
        };
    
        // Set the user and token in the state
        set({
          user,
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
          error: null,
          loading: false,
          isVerifying: false,
        });
    
      } catch (error: any) {
        console.error('[AuthStore] Login failed:', error);
        set({
          error: error.message || 'Login failed',
          loading: false,
        });
        throw error;
      }
    },

    /**
     * Google sign-in success handler
     */
    handleGoogleSignInSuccess: async (response: any) => {
      try {
        set({ loading: true, error: null });
        // Response should contain an idToken
        const idToken = response?.data?.idToken;
        if (!idToken) {
          throw new Error('No ID token in response');
        }
    
        // Sign in with Supabase using the ID token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) throw error;
    
        if (!data.session) {
          throw new Error('No session returned from Google sign-in');
        }
    
        // Log the session and token
        logger.debug('AUTH', 'Session after Google sign-in:', {
          userId: data.session.user.id,
          expiresAt: data.session.expires_at
        });
    
        // Build user from session
        const user: User = {
          id: data.session.user.id,
          email: data.session.user.email ?? '',
          username: data.session.user.user_metadata?.username ?? '',
          firstName: data.session.user.user_metadata?.firstName,
          lastName: data.session.user.user_metadata?.lastName,
          profilePicture: data.session.user.user_metadata?.avatar_url,
        };
    
        set({
          user,
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
          loading: false,
          error: null,
          isVerifying: false
        });
        logger.debug('AUTH', 'Authentication successful', {
          accessToken: data.session.access_token.substring(0, 10) + '...',
          refreshToken: data.session.refresh_token ? data.session.refresh_token.substring(0, 10) + '...' : 'none'
        });
      } catch (error: any) {
        logger.error('AUTH', 'Google sign-in error:', error);
        set({
          error: error.message || 'Google sign-in failed',
          loading: false
        });
        throw error;
      }
    },

    /**
     * Logout the user
     */
    logout: async () => {
      try {
        logger.debug('AUTH', 'Logging out user');
        set({ loading: true });
        
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        if (error) {
          logger.error('AUTH', 'Error during logout:', error);
          // Continue with local logout even if Supabase logout fails
        }
        
        // Clear all auth-related data from AsyncStorage
        try {
          await AsyncStorage.multiRemove([
            'supabase.auth.token',
            'supabase.auth.refreshToken',
            'supabase.auth.user'
          ]);
        } catch (storageError) {
          logger.error('AUTH', 'Error clearing storage during logout:', storageError);
          // Continue with logout even if storage clearing fails
        }
        
        // Reset the auth state
        set({
          user: null,
          token: null,
          refreshToken: null,
          loading: false,
          error: null,
          status: 'unauthenticated'
        });
        
        logger.debug('AUTH', 'Logout completed successfully');
      } catch (error) {
        logger.error('AUTH', 'Unexpected error during logout:', error);
        // Ensure state is reset even if there's an error
        set({
          user: null,
          token: null,
          refreshToken: null,
          loading: false,
          error: null,
          status: 'unauthenticated'
        });
      }
    },

    /**
     * Mark first-time onboarding as done
     */
    setFirstTimeDone: async () => {
      set({ isFirstTime: false });
    }
  };
});