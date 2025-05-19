import { create } from 'zustand';
import { supabase, refreshSupabaseSession, registerPushTokenService } from '@/src/features/auth/service'; // Corrected import
import type { AuthState, LoginCredentials, RegisterCredentials, User, AuthStatus, GoogleSignInResponse } from '@/src/features/auth/types'; // Corrected path
import { Session, AuthChangeEvent } from '@supabase/supabase-js'; // Added AuthChangeEvent
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store'; // Added import
import { logger } from '@/src/utils/logger'; // Path might need update if utils/logger.ts is moved/refactored
import { authApi } from '@/src/api/auth-api'; // This will likely be replaced by AuthService methods
import { ERROR_CODES, ERROR_MESSAGES } from '@/src/api/constants'; // Path might need update
import { registerAuthHandlers } from '@/src/api/api-client'; // This needs careful review for new service structure
import * as Notifications from 'expo-notifications';
import { api } from '@/src/api/api-client'; // This will likely be replaced by AuthService methods
import { onboardUser } from '@/src/api/api-client';

const ACCESS_TOKEN_KEY = 'supabase_access_token'; // Added constant

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
    const { data: { session }, error } = await supabase.auth.getSession(); // Uses new supabase import
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
        let initialToken: string | null = null;
        try {
          initialToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        } catch (e) {
          logger.warn('AUTH', 'Failed to read token from SecureStore during init:', e);
        }

        const { data: { session }, error } = await supabase.auth.getSession(); // Supabase checks its persisted session

        if (session) { // If Supabase has an active session, its token is freshest
          logger.debug('AUTH', 'Supabase session restored', {
          userId: session.user.id,
            expiresAt: session.expires_at,
        });
          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.access_token);
        set({ 
          user: {
            id: session.user.id,
            email: session.user.email ?? '',
            username: session.user.user_metadata?.username ?? '',
            firstName: session.user.user_metadata?.firstName,
            lastName: session.user.user_metadata?.lastName,
            profilePicture: session.user.user_metadata?.avatar_url,
          },
            token: session.access_token, // Use Supabase session's token
          refreshToken: session.refresh_token,
            status: 'authenticated',
            isInitialized: true,
          });
        } else if (initialToken) { // Fallback: No active Supabase session, but token found in SecureStore
          logger.debug('AUTH', 'Token found in SecureStore, attempting to validate by fetching user');
          // Attempt to set user from this token, Supabase might refresh or sign in
          // This logic depends on whether a stored token alone is enough to get user info
          // For now, we'll assume refreshSession or a getUser call would be needed
          // Let's try to refresh the session if we have a token.
          // If refreshSession relies on the token being in the store, this won't work without setting it first.
          // The ideal scenario is that getSession() above handles everything.
          // If no session from getSession(), it means the stored token might be stale or invalid.
          // We should try to refresh. If refresh fails, then clear the stale token.
          try {
            // Temporarily set the token for refreshSession to potentially use it
            // Note: Supabase client internally manages tokens for refresh, so this explicit set might not be necessary
            // for refresh to work if Supabase's own storage has the refresh token.
            // This section needs careful testing with Supabase's behavior.

            // Triggering a refresh might be too aggressive here without a user action.
            // For now, if getSession() fails, we assume we are unauthenticated.
            logger.info('AUTH', 'No active Supabase session, but old token present. User needs to re-authenticate or session will be recovered by Supabase if possible.');
            // To be safe, if Supabase says no session, clear our potentially stale SecureStore token
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            set({ isInitialized: true, status: 'unauthenticated', token: null });

          } catch (refreshError) {
            logger.warn('AUTH', 'Failed to refresh session with stored token during init, clearing token:', refreshError);
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            set({ isInitialized: true, status: 'unauthenticated', token: null });
          }
        } else { // No Supabase session and no token in SecureStore
          logger.debug('AUTH', 'No session or token found during init.');
          set({ isInitialized: true, status: 'unauthenticated', token: null });
        }
      } catch (error) {
        logger.error('AUTH', 'Critical initialization error:', error);
        try {
          await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        } catch (e) {
          logger.error('AUTH', 'Failed to clear token from SecureStore during critical init error:', e);
        }
        set({ isInitialized: true, user: null, token: null, status: 'unauthenticated' });
      }
    },

    /**
     * Refresh the authentication session
     * Relies solely on Supabase for token refresh.
     */
    refreshSession: async () => {
      try {
        logger.debug('AUTH', 'Refreshing session using Supabase');
        
        // First, check current Supabase session status; this also helps ensure Supabase client is aware of its state.
        const { data: currentSessionData, error: currentSessionError } = await supabase.auth.getSession();

        if (currentSessionError) {
          logger.error('AUTH', 'Error getting current session before refresh attempt:', currentSessionError);
          // Depending on the error, might decide to throw or attempt refresh anyway
        }

        // Attempt to refresh the session using Supabase's built-in mechanism
        const { data, error } = await supabase.auth.refreshSession(); 
        
        if (error) {
          logger.error('AUTH', 'Supabase session refresh error:', error);
          // If refresh fails, try to recover session as a last resort (Supabase might have its own recovery logic too)
          logger.debug('AUTH', 'Attempting to recover session as last resort after refreshSession failure');
          const finalRecoveredSession = await recoverSession(); // recoverSession uses supabase.auth.getSession()
          
          if (finalRecoveredSession) {
            logger.debug('AUTH', 'Session recovered successfully after refreshSession failure');
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, finalRecoveredSession.access_token); // Store new token
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
              status: 'authenticated',
              error: null,
            });
            return; // Successfully recovered and set session
          }
          
          logger.error('AUTH', 'All Supabase refresh and recovery attempts failed. Clearing session.');
          await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY); // Clear potentially stale token
          set({
            user: null,
            token: null,
            refreshToken: null,
            status: 'unauthenticated',
            error: error.message || ERROR_MESSAGES.REFRESH_FAILED,
          });
          throw error; // Re-throw the original refresh error
        }
    
        const { session } = data; // data from refreshSession()
        if (session) {
          logger.debug('AUTH', 'Session refreshed successfully via Supabase', {
            userId: session.user.id,
            expiresAt: session.expires_at
          });
          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.access_token); // Store new token
          
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
            status: 'authenticated',
            error: null,
          });
    
        } else {
          // This case should ideally not be reached if refreshSession() is called when a session or refresh token exists.
          // If it does, it implies Supabase couldn't refresh and didn't error, which is unusual.
          logger.warn('AUTH', 'Supabase refreshSession returned no session and no error. Clearing session.');
          await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY); // Clear potentially stale token
          set({
            user: null,
            token: null,
            refreshToken: null,
            status: 'unauthenticated',
            error: 'Failed to refresh session - no session returned from Supabase and no error thrown.',
          });
          throw new Error('Failed to refresh session - no session returned from Supabase');
        }
      } catch (error: any) {
        logger.error('AUTH', 'Critical refresh session error catch block:', error.message);
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY); // Ensure token is cleared on any failure path
        set({
          user: null,
          token: null,
          refreshToken: null,
          status: 'unauthenticated',
          error: error.message || ERROR_MESSAGES.REFRESH_FAILED,
        });
        throw error; // Re-throw to allow calling code to handle
      }
    },

    register: async (credentials: RegisterCredentials) => {
      try {
        set({ loading: true, error: null, status: 'verifying' });
        const { data, error } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: {
              username: credentials.username,
              firstName: credentials.firstName,
              lastName: credentials.lastName,
            },
          },
        });

        console.log('Supabase register response:', data);
        if (error) throw error;
        // After successful Supabase signUp, the user is created, and a session might be returned directly,
        // or the user might need to verify their email first depending on Supabase project settings.

        if (data.session) { // If session is returned, user is likely auto-confirmed or email verification is off
          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.session.access_token); // Store token
          let user: User = {
            id: data.session.user.id,
            email: data.session.user.email ?? '',
            username: data.session.user.user_metadata?.username ?? '',
            firstName: data.session.user.user_metadata?.firstName,
            lastName: data.session.user.user_metadata?.lastName,
            profilePicture: data.session.user.user_metadata?.avatar_url,
          };
          console.log('Setting Zustand user after register:', user);
          console.log('Setting Zustand token after register:', data.session.access_token);
          console.log('Setting Zustand refreshToken after register:', data.session.refresh_token);
          // Onboard user with backend
          try {
            user = await onboardUser();
          } catch (onboardError) {
            logger.warn('AUTH', 'Onboarding failed after register:', onboardError);
            // Continue with Supabase user if onboarding fails
          }
          set({
            user,
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
            loading: false,
            status: 'authenticated', // Or 'verifying' if email verification is pending by checking data.user.email_confirmed_at
            error: null,
          });
        } else if (data.user && !data.session) {
          // User created but needs email verification, no session yet.
          logger.info('AUTH', 'User registered, email verification pending.', { userId: data.user.id });
          set({
            loading: false,
            status: 'verifying', // Indicate email verification is needed
            error: null,
            user: { // We can set partial user info if needed
                id: data.user.id,
                email: data.user.email ?? '',
                username: data.user.user_metadata?.username ?? '',
                // ... other fields if available and useful before verification
            },
            token: null, // No token yet
            refreshToken: null,
          });
          // It's good practice to inform the user to check their email.
        } else {
            throw new Error('Registration completed but no user or session data returned.');
        }

      } catch (e: any) {
        logger.error('AUTH', 'Registration failed:', e.message);
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY); // Clear any potential token
        set({
          loading: false,
          error: e.message || 'Registration failed',
          status: 'unauthenticated',
          user: null,
          token: null,
          refreshToken: null,
        });
        throw e;
      }
    },

    registerPushToken: async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          return;
        }
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID
        });
        set({ pushToken: token.data });
        const { user } = get();
        if (user) {
          // await api.post('/users/push-token', { token: token.data }); // Old direct call
          await registerPushTokenService(token.data); // Use service method
        }
      } catch (error) {
        console.error('Failed to register push token:', error);
      }
    },

    login: async (credentials: LoginCredentials) => {
      try {
        set({ loading: true, error: null, status: 'verifying' });
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        console.log('Supabase login response:', data);
        if (error) throw error;
        if (!data.session) throw new Error('Login successful but no session returned.');

        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.session.access_token); // Store token

        let user: User = {
          id: data.session.user.id,
          email: data.session.user.email ?? '',
          username: data.session.user.user_metadata?.username ?? '',
          firstName: data.session.user.user_metadata?.firstName,
          lastName: data.session.user.user_metadata?.lastName,
          profilePicture: data.session.user.user_metadata?.avatar_url,
        };
        console.log('Setting Zustand user after login:', user);
        console.log('Setting Zustand token after login:', data.session.access_token);
        console.log('Setting Zustand refreshToken after login:', data.session.refresh_token);
        // Onboard user with backend
        try {
          user = await onboardUser();
        } catch (onboardError) {
          logger.warn('AUTH', 'Onboarding failed after login:', onboardError);
          // Continue with Supabase user if onboarding fails
        }
        set({
          user,
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
          loading: false,
          status: 'authenticated',
          error: null,
        });
      } catch (e: any) {
        logger.error('AUTH', 'Login failed:', e.message);
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY); // Clear token on failure
        set({
          loading: false,
          error: e.message || 'Login failed',
          status: 'unauthenticated',
          user: null,
          token: null,
          refreshToken: null,
        });
        throw e;
      }
    },

    handleGoogleSignInSuccess: async (session: Session) => {
      try {
        set({ loading: true, error: null, status: 'verifying' });
        console.log('Supabase Google sign-in session:', session);
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.access_token);
        let user: User = {
          id: session.user.id,
          email: session.user.email ?? '',
          username: session.user.user_metadata?.username ?? session.user.email?.split('@')[0] ?? 'User',
          firstName: session.user.user_metadata?.firstName ?? session.user.user_metadata?.full_name?.split(' ')[0] ?? '',
          lastName: session.user.user_metadata?.lastName ?? session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ?? '',
          profilePicture: session.user.user_metadata?.avatar_url ?? session.user.user_metadata?.picture ?? '',
        };
        // Onboard user with backend
        try {
          user = await onboardUser();
        } catch (onboardError) {
          logger.warn('AUTH', 'Onboarding failed after Google sign-in:', onboardError);
        }
        // Log what is being set in Zustand
        console.log('Setting Zustand user after Google sign-in:', user);
        console.log('Setting Zustand token after Google sign-in:', session.access_token);
        console.log('Setting Zustand refreshToken after Google sign-in:', session.refresh_token);
        set({
          user,
          token: session.access_token,
          refreshToken: session.refresh_token,
          loading: false,
          status: 'authenticated',
          error: null,
        });
        get().registerPushToken();
      } catch (e: any) {
        logger.error('AUTH', 'Error in handleGoogleSignInSuccess:', e.message);
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        set({
          loading: false,
          error: e.message || 'Google Sign-In processing failed',
          status: 'unauthenticated',
          user: null,
          token: null,
          refreshToken: null,
        });
      }
    },

    handleAppleSignInSuccess: async (session: Session) => {
      try {
        set({ loading: true, error: null, status: 'verifying' });
        // Token is already set in SecureStore by useAppleSignIn hook
        logger.debug('AUTH', 'Handling Apple Sign-In Success in store', { userId: session.user.id });

        let user: User = {
          id: session.user.id,
          email: session.user.email ?? '',
          // Apple often doesn't provide username, derive or prompt later if necessary
          username: session.user.user_metadata?.username ?? session.user.email?.split('@')[0] ?? 'User',
          firstName: session.user.user_metadata?.firstName ?? session.user.user_metadata?.full_name?.split(' ')[0] ?? '',
          lastName: session.user.user_metadata?.lastName ?? session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ?? '',
          profilePicture: session.user.user_metadata?.avatar_url ?? '',
        };
        // Onboard user with backend
        try {
          user = await onboardUser();
        } catch (onboardError) {
          logger.warn('AUTH', 'Onboarding failed after Apple sign-in:', onboardError);
          // Continue with Supabase user if onboarding fails
        }
        set({
          user,
          token: session.access_token,
          refreshToken: session.refresh_token,
          loading: false,
          status: 'authenticated',
          error: null,
        });
        // Potentially call registerPushToken here if not handled elsewhere on auth state change
        get().registerPushToken(); 
      } catch (e: any) {
        logger.error('AUTH', 'Error in handleAppleSignInSuccess:', e.message);
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY); // Ensure cleanup
        set({
          loading: false,
          error: e.message || 'Apple Sign-In processing failed',
          status: 'unauthenticated',
          user: null,
          token: null,
          refreshToken: null,
        });
        // Do not re-throw, hook will handle its own errors
      }
    },

    logout: async () => {
      set({ loading: true });
      const { pushToken } = get(); // Get current push token before clearing state
      try {
        logger.debug('AUTH', 'Logging out user.');

        // 1. Attempt to deregister push token from backend FIRST
        if (pushToken) {
          try {
            // Assuming your API client (api) is set up and handles auth token automatically
            // The endpoint /users/push-token/deregister is hypothetical; replace with your actual endpoint
            await api.post('/users/push-token/deregister', { token: pushToken }); 
            logger.info('AUTH', 'Push token deregistered successfully.');
          } catch (e: any) {
            logger.warn('AUTH', 'Failed to deregister push token:', e.message);
            // Continue with logout even if push token deregistration fails
          }
        }

        // 2. Sign out from Supabase
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          // Log error but attempt to clear client-side session anyway
          logger.error('AUTH', 'Supabase signOut error:', signOutError.message);
        }

        // 3. Clear token from SecureStore
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);

        // 4. Reset Zustand store
        set({
          user: null,
          token: null,
          refreshToken: null,
          status: 'unauthenticated',
          loading: false,
          error: null,
          pushToken: null, // Clear push token from state as well
        });
        logger.info('AUTH', 'User logged out, session and token cleared.');

      } catch (e: any) {
        logger.error('AUTH', 'Logout process failed critically:', e.message);
        // Even on critical failure, attempt to clear sensitive local data
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        set({
          user: null,
          token: null,
          refreshToken: null,
          status: 'unauthenticated',
          loading: false,
          error: e.message || 'Logout failed',
          pushToken: null,
        });
        // Do not re-throw, allow UI to update based on unauthenticated state
      }
    },

    // Alias for logout to support both signOut and logout naming
    signOut: async () => {
      return get().logout();
    },

    setFirstTimeDone: async () => {
      // This is likely for onboarding. Not directly related to core auth token logic.
      // Assuming it sets a flag in AsyncStorage or similar.
      try {
        await AsyncStorage.setItem('@app_first_time_done', 'true');
        set({ isFirstTime: false });
        logger.info('AUTH', 'First time setup marked as done.');
      } catch (e:any) {
        logger.error('AUTH', 'Failed to set first time done flag:', e.message);
      }
    },
  };

  // Setup Supabase onAuthStateChange listener
  // This should ideally be done once when the store is created.
  // The returned unsubscribe function should be called if the app/store is ever destroyed (rare in RN).
  const unsubscribeAuthStateListener = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
    logger.debug('AUTH', `onAuthStateChange event: ${event}`, session ? { userId: session.user.id, event } : { event });

    if (event === 'SIGNED_IN') {
      if (session) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.access_token);
        set({
          user: {
            id: session.user.id,
            email: session.user.email ?? '',
            username: session.user.user_metadata?.username ?? session.user.email?.split('@')[0] ?? 'User',
            firstName: session.user.user_metadata?.firstName ?? session.user.user_metadata?.full_name?.split(' ')[0] ?? '',
            lastName: session.user.user_metadata?.lastName ?? session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ?? '',
            profilePicture: session.user.user_metadata?.avatar_url ?? session.user.user_metadata?.picture ?? '',
          },
          token: session.access_token,
          refreshToken: session.refresh_token,
          status: 'authenticated',
          loading: false,
          error: null,
        });
        get().registerPushToken(); // Register push token on new sign-in
      } else {
        // Should not happen for SIGNED_IN, but handle defensively
        logger.warn('AUTH', 'SIGNED_IN event with no session, clearing local state.');
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        set({ user: null, token: null, refreshToken: null, status: 'unauthenticated' });
      }
    } else if (event === 'SIGNED_OUT') {
      // This event triggers after supabase.auth.signOut() completes on the server.
      // The local logout() method should have already cleared most things.
      // This is an additional safeguard and sync mechanism.
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      set({
        user: null,
        token: null,
        refreshToken: null,
        status: 'unauthenticated',
        loading: false, // Ensure loading is reset
        error: null,      // Ensure error is reset
        pushToken: null,  // Ensure push token is cleared
      });
       logger.info('AUTH', 'onAuthStateChange: SIGNED_OUT event processed.');
    } else if (event === 'TOKEN_REFRESHED') {
      if (session) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.access_token);
        set((prevState: AuthState) => ({
          ...prevState,
          token: session.access_token,
          refreshToken: session.refresh_token, 
          // User object should generally remain the same on token refresh, unless explicitly updated by session data
          user: session.user ? { 
            ...prevState.user, // Keep existing user data not in session.user or session.user.user_metadata
            id: session.user.id,
            email: session.user.email ?? prevState.user?.email ?? '',
            username: session.user.user_metadata?.username ?? prevState.user?.username ?? session.user.email?.split('@')[0] ?? 'User',
            firstName: session.user.user_metadata?.firstName ?? prevState.user?.firstName ?? '',
            lastName: session.user.user_metadata?.lastName ?? prevState.user?.lastName ?? '',
            profilePicture: session.user.user_metadata?.avatar_url ?? prevState.user?.profilePicture ?? '',
          } : prevState.user,
          status: 'authenticated', // Ensure status remains authenticated
          loading: false, // Ensure loading is reset
          error: null, // Ensure error is reset
        }));
        logger.info('AUTH', 'onAuthStateChange: TOKEN_REFRESHED event processed.');
      } else {
        // This should not happen with TOKEN_REFRESHED. If it does, session is invalid.
        logger.warn('AUTH', 'TOKEN_REFRESHED event with no session, clearing local state.');
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        set({ user: null, token: null, refreshToken: null, status: 'unauthenticated' });
      }
    } else if (event === 'USER_UPDATED') {
      if (session && session.user) {
        set((prevState: AuthState) => ({
            ...prevState,
            user: {
                ...prevState.user, // Keep existing user data not in session.user or session.user.user_metadata
                id: session.user.id,
                email: session.user.email ?? prevState.user?.email ?? '',
                username: session.user.user_metadata?.username ?? prevState.user?.username ?? session.user.email?.split('@')[0] ?? 'User',
                firstName: session.user.user_metadata?.firstName ?? prevState.user?.firstName ?? '',
                lastName: session.user.user_metadata?.lastName ?? prevState.user?.lastName ?? '',
                profilePicture: session.user.user_metadata?.avatar_url ?? prevState.user?.profilePicture ?? '',
            }
        }));
        logger.info('AUTH', 'onAuthStateChange: USER_UPDATED event processed.');
      }
    } else if (event === 'PASSWORD_RECOVERY') {
        // User has started password recovery. UI might want to react, e.g. navigate to a reset password screen.
        // No specific state change here typically, unless you want to set a flag.
        logger.info('AUTH', 'onAuthStateChange: PASSWORD_RECOVERY event.');
    }
    // USER_DELETED is another event, but typically handled by SIGNED_OUT if session is revoked.
  });

  // If you had the registerAuthHandlers(get) call, it would go here or after returning store.
  // For now, assuming it's not critical path for these changes.

  return store;
}); 

// Initialize API client auth handlers
// This ensures the API client can access the latest auth state and methods
// for handling token refreshes and authentication headers.
const { getState } = useAuthStore;
registerAuthHandlers({
  getToken: () => getState().token,
  getRefreshToken: () => getState().refreshToken, // Ensure your store has refreshToken
  isInitialized: () => getState().isInitialized,
  refreshSession: async () => {
    // The store's refreshSession is async, so we await it.
    // The AuthState type in api-client expects Promise<void>, which this matches.
    await getState().refreshSession();
  },
  logout: () => {
    // The store's logout is async. The AuthState type expects void.
    // Calling an async function where void is expected is fine; the promise is ignored.
    getState().logout();
  },
}); 