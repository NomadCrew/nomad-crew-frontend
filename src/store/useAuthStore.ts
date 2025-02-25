import { create } from 'zustand';
import { supabase } from '@/src/auth/supabaseClient';
import type { AuthState, LoginCredentials, RegisterCredentials, User, AuthStatus } from '@/src/types/auth';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/src/utils/logger';

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

    refreshSession: async () => {
      try {
        logger.debug('AUTH', 'Refreshing session');
        const { data, error } = await supabase.auth.refreshSession();
        if (error) throw error;
    
        const { session } = data;
        if (session) {
          logger.debug('AUTH', 'Session refreshed successfully', {
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
          });
    
        } else {
          throw new Error('Failed to refresh session');
        }
      } catch (error: any) {
        logger.error('AUTH', 'Refresh session error:', error);
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
     * Logout: sign out from Supabase and reset store
     */
    logout: async () => {
      try {
        set({ loading: true });
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error: any) {
        console.error('[AuthStore] Logout error:', error);
      } finally {
        set({
          user: null,
          token: null,
          loading: false,
          error: null,
          isVerifying: false
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