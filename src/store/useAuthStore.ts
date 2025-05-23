import { create } from 'zustand';
import { supabase } from '@/src/auth/supabaseClient';
import type { AuthState, LoginCredentials, RegisterCredentials, User, AuthStatus } from '@/src/types/auth';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/src/utils/logger';
import { authApi } from '@/src/api/auth-api';
import { ERROR_CODES, ERROR_MESSAGES } from '@/src/api/constants';
import { registerAuthHandlers } from '@/src/api/api-client';
import * as Notifications from 'expo-notifications';
import { api } from '@/src/api/api-client';

// API Error interface for better type safety
interface ApiError extends Error {
  response?: {
    data?: {
      code?: string;
      message?: string;
      login_required?: boolean;
      [key: string]: unknown;
    };
    status?: number;
  };
  status?: number;
  code?: string;
  [key: string]: unknown;
}

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
    logger.error('AUTH', 'Session recovery failed:', error);
  }
  return null;
};

export const useAuthStore = create<AuthState>((set, get) => {
  // State for user, token, loading, etc.
  const store = {
    user: null,
    token: null,
    loading: false,
    error: null,
    isInitialized: false,
    isFirstTime: false,
    isVerifying: false,
    status: 'unauthenticated' as AuthStatus,
    refreshToken: null,
    pushToken: null,

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
     * Relies solely on Supabase for token refresh.
     */
    refreshSession: async () => {
      try {
        logger.debug('AUTH', 'Refreshing session using Supabase');
        
        // Get the current refresh token from Supabase's perspective by trying to get a new session
        // This also handles the case where there's no local refresh token but Supabase might have one.
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          logger.error('AUTH', 'Error getting current session for refresh:', sessionError);
          throw sessionError; // Propagate error to be caught by outer catch
        }

        if (!sessionData.session?.refresh_token) {
          logger.debug('AUTH', 'No active session or refresh token available from Supabase. Attempting to recover session as a final step.');
          // Try to recover session from Supabase if getSession didn't yield a refresh token
          // This handles cases where the SDK might recover a session if getSession didn't fully.
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
          logger.warn('AUTH', 'No refresh token available and session recovery failed during refresh process.');
          throw new Error('No refresh token available and session recovery failed.');
        }
        
        // At this point, sessionData.session.refresh_token should be valid if one exists.
        // We can proceed to call refreshSession with it, or rely on supabase.auth.refreshSession() 
        // which implicitly uses the stored refresh token.
        // Using supabase.auth.refreshSession() is simpler and aligns with SDK's intended use.
        
        logger.debug('AUTH', 'Attempting to refresh via Supabase refreshSession()');
        const { data, error } = await supabase.auth.refreshSession(); // This uses the stored refresh token
        
        if (error) {
          logger.error('AUTH', 'Supabase session refresh error:', error);
          
          // If Supabase refresh fails, try one last attempt to recover session
          // This might help if the refresh token was just invalidated but a session still exists somehow
          logger.debug('AUTH', 'Attempting to recover session as last resort after refreshSession failure');
          const finalRecoveredSession = await recoverSession();
          
          if (finalRecoveredSession) {
            logger.debug('AUTH', 'Session recovered successfully after refreshSession failure');
            const user: User = {
              id: finalRecoveredSession.user.id,
              email: finalRecoveredSession.user.email ?? '',
              username: finalRecoveredSession.user.user_metadata?.username ?? '',
              firstName: finalRecoveredSession.user.user_metadata?.firstName,
              lastName: finalRecoveredSession.user.user_metadata?.lastName,
              profilePicture: finalRecoveredSession.user.user_metadata?.avatar_url,
            };
            
            set({
              user,
              token: finalRecoveredSession.access_token,
              refreshToken: finalRecoveredSession.refresh_token,
              status: 'authenticated'
            });
            return;
          }
          
          // If all refresh attempts fail, clear auth state and throw error
          logger.error('AUTH', 'All Supabase refresh and recovery attempts failed.');
          set({
            user: null,
            token: null,
            refreshToken: null,
            status: 'unauthenticated'
          });
          throw new Error(ERROR_MESSAGES.REFRESH_FAILED); // Use a defined error message
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
          // This case should ideally be caught by the error in supabase.auth.refreshSession()
          logger.warn('AUTH', 'Supabase refreshSession returned no session and no error.');
          throw new Error('Failed to refresh session - no session returned from Supabase');
        }
      } catch (error: any) {
        logger.error('AUTH', 'Critical refresh session error:', error.message);
        // Clear auth state on critical errors
        set({
          user: null,
          token: null,
          refreshToken: null,
          status: 'unauthenticated',
          error: error.message || ERROR_MESSAGES.REFRESH_FAILED, // Store the error message
        });
        // Re-throw the error so the caller (e.g., api-client) can handle it
        // This is important for the api-client to know that refresh failed and trigger logout.
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
      } catch (error: unknown) {
        console.error('[Auth] Registration error:', error);
        set({
          error: error instanceof Error ? error.message : 'Registration failed',
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
    
      } catch (error: unknown) {
        console.error('[Auth] Login failed:', error);
        set({
          error: error instanceof Error ? error.message : 'Login failed',
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
        
        console.log('Google Sign-In response:', response);
        
        // Extract the ID token based on the response structure
        let idToken = null;
        
        // Handle different response formats from different platforms
        if (response?.idToken) {
          // Direct format
          idToken = response.idToken;
        } else if (response?.user?.idToken) {
          // Nested user format
          idToken = response.user.idToken;
        } else if (response?.data?.idToken) {
          // Data wrapper format
          idToken = response.data.idToken;
        } else if (response?.authentication?.idToken) {
          // Authentication wrapper format (common in React Native)
          idToken = response.authentication.idToken;
        }
        
        if (!idToken) {
          console.error('No ID token found in response:', response);
          throw new Error('No ID token in response');
        }
        
        console.log('Using ID token:', idToken.substring(0, 10) + '...');
    
        // Sign in with Supabase using the ID token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        
        if (error) {
          console.error('Supabase sign-in error:', error);
          throw error;
        }
    
        if (!data.session) {
          throw new Error('No session returned from Google sign-in');
        }
    
        // Log the session and token
        console.log('AUTH: Session after Google sign-in:', {
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
        
        console.log('AUTH: Authentication successful', {
          accessToken: data.session.access_token.substring(0, 10) + '...',
          refreshToken: data.session.refresh_token ? data.session.refresh_token.substring(0, 10) + '...' : 'none'
        });
      } catch (error: ApiError) {
        console.error('AUTH: Google sign-in error:', error);
        set({
          error: error.message || 'Google sign-in failed',
          loading: false
        });
        throw error;
      }
    },

    /**
     * Apple sign-in success handler
     */
    handleAppleSignInSuccess: async (session: Session) => {
      try {
        set({ loading: true, error: null });

        // Build user from session
        const user: User = {
          id: session.user.id,
          email: session.user.email ?? '',
          username: session.user.user_metadata?.username ?? '',
          firstName: session.user.user_metadata?.firstName,
          lastName: session.user.user_metadata?.lastName,
          profilePicture: session.user.user_metadata?.avatar_url,
          appleUser: true
        };

        set({
          user,
          token: session.access_token,
          refreshToken: session.refresh_token,
          loading: false,
          error: null,
          isVerifying: false
        });

      } catch (error: ApiError) {
        console.error('AUTH: Apple sign-in error:', error);
        set({
          error: error.message || 'Apple sign-in failed',
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
    },

    registerPushToken: async () => {
      try {
        // Check if we already have permission
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          return;
        }

        // Get the token
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID // Add this to your env
        });

        // Store it locally
        set({ pushToken: token.data });

        // Send it to the backend
        const { user } = get();
        if (user) {
          await api.post('/users/push-token', { token: token.data });
        }
      } catch (error) {
        console.error('Failed to register push token:', error);
      }
    }
  };

  // Register auth handlers with the API client
  registerAuthHandlers({
    getToken: () => get().token,
    getRefreshToken: () => get().refreshToken,
    isInitialized: () => get().isInitialized,
    refreshSession: async () => await get().refreshSession(),
    logout: () => get().logout(),
  });

  return store;
});