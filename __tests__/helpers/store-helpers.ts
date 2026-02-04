import { useAuthStore } from '@/src/features/auth/store';
import { useTripStore } from '@/src/features/trips/store';
import { User } from '@/src/features/auth/types';

/**
 * Store Test Helpers
 *
 * Utilities for managing Zustand store state in tests.
 * These helpers ensure stores are properly reset between tests
 * and provide convenient setup methods for common scenarios.
 */

/**
 * Resets all Zustand stores to their initial state.
 * Call this in beforeEach or afterEach to ensure test isolation.
 *
 * @example
 * beforeEach(() => {
 *   resetAllStores();
 * });
 */
export const resetAllStores = () => {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    loading: false,
    error: null,
    isInitialized: false,
    isFirstTime: false,
    isVerifying: false,
    status: 'unauthenticated',
    pushToken: null,
  });

  useTripStore.setState({
    trips: [],
    loading: false,
    error: null,
    selectedTrip: null,
  });
};

/**
 * Sets up the auth store with an authenticated user.
 * Useful for testing features that require authentication.
 *
 * @param user - The user object to set as authenticated
 * @param token - The access token (default: 'test-token')
 * @param refreshToken - The refresh token (default: 'refresh-token')
 *
 * @example
 * import { createMockUser } from '@/__tests__/factories';
 *
 * beforeEach(() => {
 *   const user = createMockUser();
 *   setupAuthenticatedUser(user);
 * });
 */
export const setupAuthenticatedUser = (
  user: User,
  token: string = 'test-token',
  refreshToken: string = 'refresh-token'
) => {
  useAuthStore.setState({
    user,
    token,
    refreshToken,
    isInitialized: true,
    status: 'authenticated',
    loading: false,
    error: null,
    isVerifying: false,
    isFirstTime: false,
    pushToken: null,
  });
};

/**
 * Sets up the auth store in an unauthenticated state.
 * Useful for testing login/register flows.
 *
 * @example
 * beforeEach(() => {
 *   setupUnauthenticatedUser();
 * });
 */
export const setupUnauthenticatedUser = () => {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isInitialized: true,
    status: 'unauthenticated',
    loading: false,
    error: null,
    isVerifying: false,
    isFirstTime: false,
    pushToken: null,
  });
};

/**
 * Sets up the auth store in a loading state.
 * Useful for testing loading UI states.
 *
 * @example
 * beforeEach(() => {
 *   setupAuthLoading();
 * });
 */
export const setupAuthLoading = () => {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isInitialized: false,
    status: 'unauthenticated',
    loading: true,
    error: null,
    isVerifying: false,
    isFirstTime: false,
    pushToken: null,
  });
};

/**
 * Sets up the auth store with an error state.
 * Useful for testing error handling.
 *
 * @param error - The error message to set
 *
 * @example
 * beforeEach(() => {
 *   setupAuthError('Authentication failed');
 * });
 */
export const setupAuthError = (error: string) => {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isInitialized: true,
    status: 'unauthenticated',
    loading: false,
    error,
    isVerifying: false,
    isFirstTime: false,
    pushToken: null,
  });
};

/**
 * Gets the current auth state from the store.
 * Useful for assertions in tests.
 *
 * @returns The current auth state
 *
 * @example
 * const authState = getAuthState();
 * expect(authState.user).toBeDefined();
 * expect(authState.status).toBe('authenticated');
 */
export const getAuthState = () => useAuthStore.getState();

/**
 * Gets the current trip state from the store.
 * Useful for assertions in tests.
 *
 * @returns The current trip state
 *
 * @example
 * const tripState = getTripState();
 * expect(tripState.trips).toHaveLength(2);
 */
export const getTripState = () => useTripStore.getState();

/**
 * Waits for the auth store to finish loading.
 * Useful for async operations.
 *
 * @param timeout - Maximum time to wait in ms (default: 5000)
 * @returns Promise that resolves when loading is complete
 *
 * @example
 * await waitForAuthLoading();
 * expect(getAuthState().loading).toBe(false);
 */
export const waitForAuthLoading = (timeout: number = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkLoading = () => {
      if (!useAuthStore.getState().loading) {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('Auth loading timeout'));
        return;
      }

      setTimeout(checkLoading, 50);
    };

    checkLoading();
  });
};

/**
 * Waits for the trip store to finish loading.
 * Useful for async operations.
 *
 * @param timeout - Maximum time to wait in ms (default: 5000)
 * @returns Promise that resolves when loading is complete
 *
 * @example
 * await waitForTripLoading();
 * expect(getTripState().loading).toBe(false);
 */
export const waitForTripLoading = (timeout: number = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkLoading = () => {
      if (!useTripStore.getState().loading) {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('Trip loading timeout'));
        return;
      }

      setTimeout(checkLoading, 50);
    };

    checkLoading();
  });
};
