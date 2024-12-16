import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setUnauthorizedCallback } from '@/src/api/config';
import { router } from 'expo-router';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  register: (credentials: RegisterCredentials) => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Set up the unauthorized callback
  setUnauthorizedCallback(() => {
    set({ user: null, token: null });
    router.replace('/login');
  });

  return {
    user: null,
    token: null,
    loading: false,
    error: null,
    isInitialized: false,

    initialize: async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Verify token validity
          try {
            const response = await api.get('/v1/users/me');
            set({ token, user: response.data });
          } catch (error) {
            // If token verification fails, clear it
            await AsyncStorage.removeItem('auth_token');
            delete api.defaults.headers.common['Authorization'];
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth store:', error);
      } finally {
        set({ isInitialized: true });
      }
    },

    restoreToken: async () => {
      set({ loading: true });
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/v1/users/me');
          set({ token, user: response.data });
        }
      } catch (error) {
        await AsyncStorage.removeItem('auth_token');
        delete api.defaults.headers.common['Authorization'];
        set({ error: 'Failed to restore session' });
      } finally {
        set({ loading: false, isInitialized: true });
      }
    },

    register: async (credentials) => {
      try {
        set({ loading: true, error: null });
        
        const response = await api.post('/users', credentials);
        const { token, user } = response.data;

        await AsyncStorage.setItem('auth_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        set({ user, token, loading: false });
      } catch (error: any) {
        const message = error.response?.data?.message || 'Registration failed';
        set({ error: message, loading: false });
        throw new Error(message);
      }
    },

    login: async (credentials) => {
      try {
        set({ loading: true, error: null });
        
        const response = await api.post('/v1/login', credentials);
        const { token, user } = response.data;

        await AsyncStorage.setItem('auth_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        set({ user, token, loading: false });
      } catch (error: any) {
        const message = error.response?.data?.message || 'Login failed';
        set({ error: message, loading: false });
        throw new Error(message);
      }
    },

    logout: async () => {
      try {
        await AsyncStorage.removeItem('auth_token');
        delete api.defaults.headers.common['Authorization'];
        set({ token: null, user: null });
        router.replace('/login');
      } catch (error) {
        console.error('Logout error:', error);
        set({ token: null, user: null });
        router.replace('/login');
      }
    },
  };
});