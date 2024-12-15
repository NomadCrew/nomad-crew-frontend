import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import jwtDecode from 'jwt-decode';
import { secureStorage } from './secure-storage';
import { api } from '@/src/api/config';
import { ThemedView } from '@/components/ThemedView';
import type { AxiosError, AxiosRequestConfig } from 'axios';

// Type definitions
export interface User {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface JWTPayload {
  sub: string;
  exp: number;
  iat: number;
  email: string;
}

export interface AuthState {
  status: 'idle' | 'signIn' | 'signOut';
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

export type AuthAction =
  | { type: 'RESTORE_TOKEN'; user: User }
  | { type: 'SIGN_IN'; user: User }
  | { type: 'SIGN_OUT' }
  | { type: 'START_LOADING' }
  | { type: 'ERROR'; error: string };

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const AUTH_CONTEXT_ERROR = 'useAuth must be used within an AuthProvider';

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null);

// Helper Types
interface RetryConfig extends AxiosRequestConfig {
  _retryCount?: number;
}

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        status: 'signIn',
        isLoading: false,
        user: action.user,
        error: null,
      };
    case 'SIGN_IN':
      return {
        ...state,
        status: 'signIn',
        isLoading: false,
        user: action.user,
        error: null,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        status: 'signOut',
        isLoading: false,
        user: null,
        error: null,
      };
    case 'START_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
  }
}

// Helper functions
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

async function refreshToken(): Promise<void> {
  try {
    const { refreshToken } = await secureStorage.getTokens();
    if (!refreshToken) throw new Error('No refresh token');

    const { data } = await api.post('/auth/refresh', { refreshToken });
    await secureStorage.setTokens(data.token, data.refreshToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  } catch (error) {
    throw new Error('Failed to refresh token');
  }
}

const createAuthInterceptor = (signOut: () => Promise<void>) => {
  return async (error: AxiosError) => {
    const config = error.config as RetryConfig;
    
    if (error.response?.status === 401 && (!config._retryCount || config._retryCount < MAX_RETRY_ATTEMPTS)) {
      config._retryCount = (config._retryCount || 0) + 1;
      
      try {
        await refreshToken();
        return api(config);
      } catch (refreshError) {
        await signOut();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  };
};

function parseJwt(token: string): JWTPayload {
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    if (!decoded.exp) {
      throw new Error('Invalid token: missing expiration');
    }
    return decoded;
  } catch (error) {
    throw new Error('Failed to parse JWT token');
  }
}

// Loading Component
const LoadingScreen = () => (
  <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
  </ThemedView>
);

// Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    status: 'idle',
    isLoading: true,
    user: null,
    error: null,
  });

  const authActions = useMemo(
    () => ({
      signIn: async (email: string, password: string) => {
        try {
          dispatch({ type: 'START_LOADING' });
          const { data } = await api.post('/auth/login', { email, password });
          
          await secureStorage.setTokens(data.token, data.refreshToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          
          dispatch({ type: 'SIGN_IN', user: data.user });
          router.replace('/(tabs)');
        } catch (error) {
          dispatch({ type: 'ERROR', error: getErrorMessage(error) });
          throw error;
        }
      },
      signOut: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          await secureStorage.clearTokens();
          delete api.defaults.headers.common['Authorization'];
          dispatch({ type: 'SIGN_OUT' });
          router.replace('/login');
        }
      },
      register: async (data: RegisterData) => {
        try {
          dispatch({ type: 'START_LOADING' });
          const response = await api.post('/auth/register', data);
          
          await secureStorage.setTokens(
            response.data.token,
            response.data.refreshToken
          );
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          
          dispatch({ type: 'SIGN_IN', user: response.data.user });
          router.replace('/(tabs)');
        } catch (error) {
          dispatch({ type: 'ERROR', error: getErrorMessage(error) });
          throw error;
        }
      },
    }),
    []
  );

  // Set up auth interceptor
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      createAuthInterceptor(authActions.signOut)
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [authActions.signOut]);

  // Handle token refresh
  useEffect(() => {
    if (state.status !== 'signIn') return;

    let refreshTimeout: NodeJS.Timeout;

    const setupRefresh = async () => {
      try {
        const { token } = await secureStorage.getTokens();
        if (!token) return;

        const decoded = parseJwt(token);
        const now = Date.now();
        const expiresAt = decoded.exp * 1000;
        const refreshTime = Math.max(0, expiresAt - now - 60000); // 1 minute before expiry

        refreshTimeout = setTimeout(refreshToken, refreshTime);
      } catch (error) {
        console.error('Failed to setup token refresh:', error);
        authActions.signOut().catch(console.error);
      }
    };

    setupRefresh();
    return () => clearTimeout(refreshTimeout);
  }, [state.status, authActions.signOut]);

  const value = useMemo(
    () => ({
      ...state,
      ...authActions,
    }),
    [state, authActions]
  );

  if (state.isLoading && state.status === 'idle') {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(AUTH_CONTEXT_ERROR);
  }
  return context;
}