import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/src/api/config';

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  isInitialized: false,

  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        // Set the token in axios defaults
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // TODO: Fetch user profile here
        set({ token });
      }
    } catch (error) {
      console.error('Failed to initialize auth store:', error);
    }
  },

  restoreToken: async () => {
    set({ loading: true });
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        // Optionally verify token validity here
        // You could make a request to /verify-token endpoint if you have one
        set({ token });

        // Set the token in API headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Optionally fetch user data
        const response = await api.get('/users/me');
        set({ user: response.data });
      }
    } catch (error) {
      // If there's an error (invalid token, network error, etc.), clean up
      await AsyncStorage.removeItem('auth_token');
      set({ error: 'Failed to restore session' });
      delete api.defaults.headers.common['Authorization'];
    } finally {
      set({ loading: false, isInitialized: true });
    }
  },

  register: async (credentials) => {
    try {
      set({ loading: true, error: null });
      
      // Register user
      const response = await api.post('/users', credentials);
      const { token, user } = response.data;

      // Store token
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
      set({ token: null, user: null });
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear the state even if storage removal fails
      set({ token: null, user: null });
    }
  },
}));