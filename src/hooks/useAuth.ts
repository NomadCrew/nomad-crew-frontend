import { useAuthStore } from '@/src/store/useAuthStore';

/**
 * Hook to access authentication state and methods
 */
export const useAuth = () => {
  const {
    user,
    token,
    status,
    loading,
    error,
    isInitialized,
    login,
    register,
    logout,
    refreshSession,
  } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated: status === 'authenticated',
    isLoading: loading,
    error,
    isInitialized,
    login,
    register,
    logout,
    refreshSession,
  };
}; 