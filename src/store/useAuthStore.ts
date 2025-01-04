import { create } from 'zustand';
import { supabase } from '@/src/auth/supabaseClient';
import { secureTokenManager } from '@/src/auth/secure-token-manager';
import type { AuthState, LoginCredentials, RegisterCredentials, User } from '@/src/types/auth';

export const useAuthStore = create<AuthState>((set, get) => {
  let sessionProcessing: Promise<void> | null = null;
  let sessionHandled = false;
  // Set up auth state listener
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[AuthStore] Auth state change event:', event);
    if (event === 'USER_UPDATED') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        set({ isVerifying: false });
      }
    }
    console.log('[AuthStore] Session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      accessToken: !!session?.access_token,
      userId: session?.user?.id
    });

    if (sessionHandled && event === 'SIGNED_IN') {
      console.log('[AuthStore] Skipping redundant session handling');
      sessionHandled = false; // Reset for future events
      return;
    }

    if (event === 'SIGNED_IN' && session?.user) {
      if (sessionProcessing) {
        console.log('[AuthStore] Session processing already in progress');
        return;
      }
      sessionProcessing = (async () => {
        try {
          sessionHandled = true; 
          const user: User = {
            id: parseInt(session.user.id),
            email: session.user.email || '',
            username: session.user.user_metadata.username || session.user.email?.split('@')[0] || '',
            firstName: session.user.user_metadata.firstName,
            lastName: session.user.user_metadata.lastName,
            profilePicture: session.user.user_metadata.avatar_url,
          };

          await secureTokenManager.saveTokens(session.access_token!, session.refresh_token!);
          
          console.log('[AuthStore] Setting state with token:', session.access_token);
          
          set({ 
            user,
            token: session.access_token,
            error: null,
            loading: false
          });
        } catch (error) {
          console.error('[AuthStore] Error processing sign in:', error);
          set({ error: 'Failed to process sign in', loading: false });
        } finally {
          sessionProcessing = null;
        }
      })();
    } else if (event === 'SIGNED_OUT') {
      console.log('[AuthStore] User signed out');
      set({
        user: null,
        token: null,
        error: null,
        loading: false
      });
    }
  });

  return {
    user: null,
    token: null,
    loading: false,
    error: null,
    isInitialized: false,
    isFirstTime: false,
    isVerifying: false,

    initialize: async () => {
      const state = get();
      console.log('[AuthStore] Checking initialization state', {
        loading: state.loading,
        isInitialized: state.isInitialized
      });
    
      // Prevent duplicate initialization
      if (state.loading || state.isInitialized) {
        console.log('[AuthStore] Initialization already in progress or completed');
        return;
      }
    
      set({ loading: true });
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
    
        if (session?.user) {
          const user: User = {
            id: parseInt(session.user.id),
            email: session.user.email || '',
            username: session.user.user_metadata.username || session.user.email?.split('@')[0] || '',
            firstName: session.user.user_metadata.firstName,
            lastName: session.user.user_metadata.lastName,
            profilePicture: session.user.user_metadata.avatar_url,
          };
    
          try {
            // Store tokens securely
            if (session.access_token && session.refresh_token) {
              await secureTokenManager.saveTokens(session.access_token, session.refresh_token);
            }
          } catch (tokenError) {
            console.error('[AuthStore] Token save error:', tokenError);
            // Continue with session - don't fail initialization
          }
    
          set({
            user,
            token: session.access_token || null,
            isInitialized: true,
            loading: false,
            error: null
          });
        } else {
          console.log('[AuthStore] No active session found');
          set({
            isInitialized: true,
            loading: false,
            user: null,
            token: null
          });
        }
    
        console.log('[AuthStore] Initialization complete');
      } catch (error: any) {
        console.error('[AuthStore] Initialization error:', error);
        set({
          error: error.message || 'Failed to initialize session',
          isInitialized: true,
          loading: false,
          user: null,
          token: null
        });
        throw error;
      }
    },

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
  
        set({ 
          isVerifying: true,
          loading: false,
          error: null 
        });
  
        set({ loading: false });
        return true;
      } catch (error: any) {
        set({
          error: error.message,
          loading: false
        });
        throw error;
      }
    },

    login: async (credentials: LoginCredentials) => {
      try {
        console.log('[AuthStore] Starting login - current state:', {
          loading: get().loading,
          isVerifying: get().isVerifying,
          error: get().error
        });
        set({ loading: true, error: null });
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
    
        console.log('[AuthStore] Supabase login response:', {
          hasData: !!data,
          hasSession: !!data?.session,
          error: error?.message
        });
    
        if (error?.message === 'Invalid login credentials') {
          set({ 
            loading: false,
            error: 'unregistered_user'
          });
          return;
        }

        if (error?.message === 'Email not confirmed') {
          set({ 
            loading: false,
            error: 'email_not_verified',
            user: null,
            token: null
          });
          return;
        }
    
        if (error) throw error;
        
        if (!data.session) {
          throw new Error('No session returned');
        }
    
        set({ loading: false });
      } catch (error: any) {
        console.error('[AuthStore] Login failed:', error);
        set({
          error: error.message || 'Login failed',
          loading: false
        });
        throw error;
      }
    },

    handleGoogleSignInSuccess: async (response: any) => {
      try {
        console.log('[AuthStore] Processing Google Sign-in response');
        set({ loading: true, error: null });
    
        // Extract token from the nested structure
        const idToken = response?.data?.idToken;
        if (!idToken) {
          throw new Error('No ID token in response');
        }
    
        console.log('[AuthStore] Signing in with Supabase using Google token');
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        
        if (error) {
          console.error('[AuthStore] Supabase sign-in error:', error);
          throw error;
        }
        
        console.log('[AuthStore] Google sign-in successful');
        set({ loading: false });
      } catch (error: any) {
        console.error('[AuthStore] Google sign-in error:', error);
        set({
          error: error.message || 'Google sign-in failed',
          loading: false
        });
        throw error;
      }
    },

    logout: async () => {
      try {
        set({ loading: true });
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Auth state listener will handle the cleanup
        set({ loading: false });
      } catch (error: any) {
        console.error('Logout error:', error);
        set({
          error: error.message || 'Logout failed',
          loading: false
        });
      }
    },

    setFirstTimeDone: async () => {
      set({ isFirstTime: false });
    }
  };
});