import { create } from 'zustand';
import { api } from '@/src/api/api-client';
import { router } from 'expo-router';
import { secureTokenManager } from '@/src/auth/secure-token-manager';
import { API_PATHS } from '@/src/utils/api-paths';
import type { RegisterCredentials, LoginCredentials, AuthState } from '@/src/types/auth';

export const useAuthStore = create<AuthState>((set, get) => {
  console.log('Starting auth initialization'); // Debug log
  return {
  user: null,
  token: null,
  loading: false,
  error: null,
  isInitialized: false,

  initialize: async () => {
    console.log('[AuthStore] Starting initialization');
    
    // Prevent multiple initialization attempts
    if (get().loading) {
      console.log('[AuthStore] Already loading, skipping');
      return;
    }
  
    set({ loading: true });
    
    try {
      console.log('[AuthStore] Checking for token');
      const token = await secureTokenManager.getToken();
      console.log('[AuthStore] Token exists:', !!token);
  
      if (!token) {
        console.log('[AuthStore] No token found, completing initialization');
        set({ 
          isInitialized: true, 
          loading: false,
          token: null,
          user: null
        });
        return;
      }
  
      try {
        console.log('[AuthStore] Validating token and fetching user data');
        const response = await api.get(API_PATHS.users.me);
        console.log('[AuthStore] Successfully fetched user data');
        
        set({
          user: response.data,
          token,
          isInitialized: true,
          loading: false,
          error: null
        });
      } catch (apiError) {
        console.log('[AuthStore] API error:', apiError);
        await secureTokenManager.clearTokens();
        set({
          user: null,
          token: null,
          isInitialized: true,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('[AuthStore] Initialization error:', error);
      set({
        error: 'Failed to initialize session',
        user: null,
        token: null,
        isInitialized: true,
        loading: false
      });
    }
  },

  register: async (credentials: RegisterCredentials) => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.post(API_PATHS.users.create, credentials);
      const { token, refreshToken, user } = response.data;

      await secureTokenManager.saveTokens(token, refreshToken);
      set({ user, token, loading: false });
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  login: async (credentials: LoginCredentials) => {
    try {
        set({ loading: true, error: null });
        const response = await api.post(API_PATHS.auth.login, credentials);
        const { token, refreshToken, user } = response.data;

        await secureTokenManager.saveTokens(token, refreshToken);
        set({ user, token, loading: false });
        router.replace('/(tabs)');
    } catch (error: unknown) {
        // Narrowing error type
        const message = 
            error instanceof Error
                ? error.message
                : error && typeof error === 'object' && 'response' in error
                    ? (error as any).response?.data?.message || 'Login failed'
                    : 'Login failed';

        set({ error: message, loading: false });
        throw error; // Optional, depends on how you're handling errors globally
    }
},

  logout: async () => {
    try {
      set({ loading: true });
      await api.post(API_PATHS.auth.logout);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await secureTokenManager.clearTokens();
      set({ 
        token: null, 
        user: null, 
        loading: false,
        error: null 
      });
      router.replace('/login');
    }
  },
};
});