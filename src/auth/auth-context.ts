import { createContext, useContext, useEffect, useMemo } from 'react';
import { secureStorage } from './secure-storage';
import { api } from '@/src/api/config';
import { router } from 'expo-router';

interface AuthState {
  status: 'idle' | 'signOut' | 'signIn';
  isLoading: boolean;
  user: User | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    status: 'idle',
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { token, refreshToken } = await secureStorage.getTokens();
        
        if (!token || !refreshToken) {
          throw new Error('No tokens found');
        }

        // Validate token and get user data
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const { data: user } = await api.get('/users/me');

        dispatch({ type: 'RESTORE_TOKEN', user });
      } catch (error) {
        await secureStorage.clearTokens();
        dispatch({ type: 'SIGN_OUT' });
      }
    };

    initializeAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (state.status !== 'signIn') return;

    let refreshTimeout: NodeJS.Timeout;

    const setupRefresh = async () => {
      try {
        const { token } = await secureStorage.getTokens();
        if (!token) return;

        // Decode token to get expiration (assumes JWT)
        const decoded = jwtDecode(token);
        const expiresIn = decoded.exp! * 1000 - Date.now() - 60000; // Refresh 1 minute before expiry

        refreshTimeout = setTimeout(refreshToken, expiresIn);
      } catch (error) {
        console.error('Failed to setup token refresh:', error);
      }
    };

    setupRefresh();
    return () => clearTimeout(refreshTimeout);
  }, [state.status]);

  // Set up API response interceptor for 401 errors
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          try {
            await refreshToken();
            // Retry the original request
            return api(error.config);
          } catch (refreshError) {
            // If refresh fails, sign out
            await signOut();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

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

  const value = useMemo(
    () => ({
      ...state,
      ...authActions,
    }),
    [state, authActions]
  );

  if (state.isLoading && state.status === 'idle') {
    return <LoadingScreen />; // Create a loading screen component
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth state reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        status: 'signIn',
        isLoading: false,
        user: action.user,
      };
    case 'SIGN_IN':
      return {
        ...state,
        status: 'signIn',
        isLoading: false,
        user: action.user,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        status: 'signOut',
        isLoading: false,
        user: null,
      };
    case 'START_LOADING':
      return {
        ...state,
        isLoading: true,
      };
    case 'ERROR':
      return {
        ...state,
        isLoading: false,
      };
    default:
      return state;
  }
}