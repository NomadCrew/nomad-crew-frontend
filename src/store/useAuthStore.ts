import { create } from 'zustand';
import { supabase } from '@/src/auth/supabaseClient';
import type { AuthState, LoginCredentials, RegisterCredentials, User } from '@/src/types/auth';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    /**
     * Called on app start to recover session
     */
    initialize: async () => {
      const state = get();
      if (state.loading || state.isInitialized) return;

      set({ loading: true });
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
  
        if (session?.user) {
          console.log('[AuthStore] Session during initialization:', session);

        // Store the token for comparison
        await AsyncStorage.setItem('tokenAfterReload', session.access_token);
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
            isInitialized: true,
            loading: false,
            error: null
          });
        } else {
          // No active session
          set({
            user: null,
            token: null,
            isInitialized: true,
            loading: false,
            error: null
          });
        }

        supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
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
            });
          } else {
            set({
              user: null,
              token: null,
            });
          }
        });
      } catch (error: any) {
        console.error('[AuthStore] Initialization error:', error);
        set({
          error: error.message || 'Failed to initialize session',
          isInitialized: true,
          loading: false,
          user: null,
          token: null
        });
      }
    },

    refreshSession: async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) throw error;
    
        const { session } = data;
        if (session) {
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
          });
    
          return session.access_token;
        } else {
          throw new Error('Failed to refresh session');
        }
      } catch (error: any) {
        console.error('[AuthStore] Refresh session error:', error);
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
        console.log('[AuthStore] Session after Google sign-in:', data.session);
    
        // Store the token temporarily for comparison
        await AsyncStorage.setItem('tokenAfterSignIn', data.session.access_token);
    
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
          loading: false,
          error: null,
          isVerifying: false
        });
        console.log('[AuthStore] Token stored after Google sign-in:', data.session.access_token.substring(0, 20) + '...');

        await supabase.auth.refreshSession();
      } catch (error: any) {
        console.error('[AuthStore] Google sign-in error:', error);
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