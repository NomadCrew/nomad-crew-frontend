import { create } from 'zustand';
import { api } from '@/src/api/api-client';
import { router } from 'expo-router';
import { secureTokenManager } from '@/src/auth/secure-token-manager';
import { API_PATHS } from '@/src/utils/api-paths';
import type { RegisterCredentials, LoginCredentials, AuthState } from '@/src/types/auth';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  isInitialized: false,

  initialize: async () => {
    try {
      set({ loading: true });
      const token = await secureTokenManager.getToken();
      
      if (token && await secureTokenManager.validateToken()) {
        const response = await api.get(API_PATHS.users.me);
        set({ 
          user: response.data, 
          token,
          isInitialized: true,
          error: null
        });
      } else {
        set({ isInitialized: true });
      }
    } catch (error) {
      console.error('Init error:', error);
      set({ 
        error: 'Failed to initialize session',
        user: null,
        token: null,
        isInitialized: true
      });
    } finally {
      set({ loading: false });
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
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, loading: false });
      throw error;
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
}));