import { BaseApiClient } from './base-client';
import { supabase } from '@/src/features/auth/service';
import { AxiosHeaders, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_PATHS } from '@/src/utils/api-paths';
import { logger } from '@/src/utils/logger';
import { ERROR_CODES, ERROR_MESSAGES } from './constants';
import { isTokenExpiringSoon } from '@/src/utils/token';
import type { User } from '@/src/features/auth/types';
import axios from 'axios';
import { shouldBypassAuth, MOCK_SIMULATOR_TOKEN } from '@/src/utils/simulator-auth';

// Token refresh lock mechanism
let isRefreshing = false;
let refreshQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: Error | unknown) => void;
}[] = [];

// Auth state access functions - to be set by the auth store
type AuthState = {
  getToken: () => string | null;
  getRefreshToken: () => string | null;
  isInitialized: () => boolean;
  refreshSession: () => Promise<void>;
  logout: () => void;
};

// Default implementations that do nothing
let authState: AuthState = {
  getToken: () => null,
  getRefreshToken: () => null,
  isInitialized: () => false,
  refreshSession: async () => {},
  logout: () => {},
};

// Function to register auth state handlers
export const registerAuthHandlers = (handlers: AuthState) => {
  authState = handlers;
};

// Process the queue with new token or error
const processQueue = (error: Error | null, token: string | null = null): void => {
  refreshQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  refreshQueue = [];
};

export class ApiClient extends BaseApiClient {
  private static instance: ApiClient;

  private constructor() {
    super();
    this.setupAuthInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupAuthInterceptors(): void {
    // 1) Attach the current token from Supabase before each request
    this.api.interceptors.request.use(
      async (config) => {
        // Skip auth for public endpoints that might exist on the backend (e.g., health checks, public data)
        // Auth-specific backend endpoints (login, register, refresh) are removed as Supabase handles these.
        const publicBackendPaths: string[] = [
          // Add any known public backend paths here if necessary, for example:
          // '/v1/public/some-data',
          // API_PATHS.auth.validate, // If validate is a public check, otherwise remove
          // API_PATHS.auth.logout, // If logout needs to be called without a token (e.g. to clear cookies), otherwise remove
        ];

        const isPublicEndpoint = publicBackendPaths.some(
          (path) => path && config.url?.includes(path)
        );

        if (isPublicEndpoint) {
          return config;
        }

        // Check for simulator auth bypass - skip token validation in dev simulator
        if (shouldBypassAuth()) {
          const token = authState.getToken();
          if (token === MOCK_SIMULATOR_TOKEN) {
            logger.debug(
              'API Client',
              'Simulator bypass: using mock token (backend must also support this)'
            );
            const headers = new AxiosHeaders(config.headers);
            headers.set('Content-Type', 'application/json');
            headers.set('Accept', 'application/json');
            headers.set('Authorization', `Bearer ${token}`);
            headers.set('X-Simulator-Bypass', 'true'); // Signal to backend
            config.headers = headers;
            return config;
          }
        }

        // Wait for both initialization AND token availability
        let attempts = 0;
        const maxAttempts = 5; // Prevent infinite loop

        while ((!authState.isInitialized() || !authState.getToken()) && attempts < maxAttempts) {
          logger.debug('API Client', 'Waiting for auth token...', {
            isInitialized: authState.isInitialized(),
            hasToken: !!authState.getToken(),
            attempt: attempts + 1,
          });
          await new Promise((resolve) => setTimeout(resolve, 200));
          attempts++;
        }

        const token = authState.getToken();

        // Check if token is expiring soon and preemptively refresh
        if (token && isTokenExpiringSoon(token) && !isRefreshing) {
          try {
            logger.debug('API Client', 'Token is expiring soon, preemptively refreshing');
            await this.refreshAuthToken();
            const newToken = authState.getToken();

            if (newToken) {
              const headers = new AxiosHeaders(config.headers);
              headers.set('Content-Type', 'application/json');
              headers.set('Accept', 'application/json');
              headers.set('Authorization', `Bearer ${newToken}`);
              config.headers = headers;
              return config;
            }
          } catch (refreshError) {
            logger.error('API Client', 'Preemptive token refresh failed:', refreshError);
            // Continue with the current token if preemptive refresh fails
          }
        }

        if (!token) {
          // Instead of throwing an error, try to refresh the token first
          try {
            logger.debug('API Client', 'No token available, attempting to refresh');
            await this.refreshAuthToken();
            const newToken = authState.getToken();

            if (newToken) {
              const headers = new AxiosHeaders(config.headers);
              headers.set('Content-Type', 'application/json');
              headers.set('Accept', 'application/json');
              headers.set('Authorization', `Bearer ${newToken}`);
              config.headers = headers;
              return config;
            }
          } catch (refreshError) {
            logger.error('API Client', 'Token refresh failed:', refreshError);
            // If refresh fails, redirect to login
            authState.logout();
            throw new Error('Authentication required');
          }
        }

        const headers = new AxiosHeaders(config.headers);
        headers.set('Content-Type', 'application/json');
        headers.set('Accept', 'application/json');
        headers.set('Authorization', `Bearer ${token}`);
        config.headers = headers;

        return config;
      },
      (error) => Promise.reject(error)
    );

    // 2) If a 401 is received, handle token refresh and retry
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // No response or no config means we can't retry
        if (!error.response || !originalRequest) {
          return Promise.reject(error);
        }

        // Check if the error is a 401 Unauthorized and we haven't tried to refresh yet
        if (error.response.status === 401 && !originalRequest._retry) {
          // Check if it's a token expiration error
          const errorData = error.response.data as any;
          const isTokenExpired =
            errorData?.code === ERROR_CODES.TOKEN_EXPIRED || errorData?.refresh_required === true;

          if (!isTokenExpired) {
            // If it's a 401 but not token expiration, just reject
            return Promise.reject(error);
          }

          // Mark as retried to prevent infinite loops
          originalRequest._retry = true;

          // If we're already refreshing, add this request to the queue
          if (isRefreshing) {
            logger.debug('API Client', 'Token refresh already in progress, queueing request');

            return new Promise((resolve, reject) => {
              refreshQueue.push({
                resolve: (token) => {
                  if (typeof token === 'string') {
                    // Update the Authorization header with the new token
                    if (!originalRequest.headers) {
                      originalRequest.headers = {};
                    }
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                  }
                  // Retry the original request
                  resolve(this.api(originalRequest));
                },
                reject: (err) => {
                  reject(err);
                },
              });
            });
          }

          // Set refreshing flag
          isRefreshing = true;

          try {
            logger.debug('API Client', 'Received 401, attempting to refresh token');

            // Refresh the token
            await this.refreshAuthToken();

            // Get the new token after refresh
            const newToken = authState.getToken();

            if (!newToken) {
              throw new Error('Token refresh failed - no new token available');
            }

            logger.debug('API Client', 'Token refreshed successfully, retrying original request');

            // Process all queued requests with the new token
            processQueue(null, newToken);

            // Update the Authorization header with the new token
            if (!originalRequest.headers) {
              originalRequest.headers = {};
            }
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

            // Retry the original request with the new token
            return this.api(originalRequest);
          } catch (refreshError: any) {
            logger.error('API Client', 'Token refresh failed:', refreshError);

            // Process all queued requests with the error
            processQueue(refreshError);

            // If refresh fails due to invalid refresh token, redirect to login
            if (refreshError.message === ERROR_MESSAGES.INVALID_REFRESH_TOKEN) {
              authState.logout();
            }

            return Promise.reject(refreshError);
          } finally {
            // Reset refreshing flag
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Refresh the authentication token
   * This is a wrapper around the auth store's refreshSession method
   */
  private async refreshAuthToken(): Promise<void> {
    try {
      await authState.refreshSession();
    } catch (error) {
      logger.error('API Client', 'Failed to refresh authentication token:', error);
      throw error;
    }
  }
}

// Singleton
export const apiClient = ApiClient.getInstance();
export const api = apiClient.getAxiosInstance();

/**
 * Calls the backend onboarding endpoint to upsert the user using the Supabase JWT.
 * Returns the user profile from the backend.
 */
export async function onboardUser(username: string): Promise<User> {
  const api = ApiClient.getInstance();
  const response = await api.getAxiosInstance().post<User>(API_PATHS.users.onboard, { username });
  return response.data;
}

/**
 * Fetches the current authenticated user's profile.
 *
 * @returns The current user's profile as a `User` object.
 */
export async function getCurrentUserProfile(): Promise<User> {
  const api = ApiClient.getInstance();
  const response = await api.getAxiosInstance().get<User>(API_PATHS.users.me);
  return response.data;
}

/**
 * Retrieve the current Supabase JWT from the registered auth handlers.
 *
 * @returns The current Supabase JWT.
 * @throws Error if no Supabase JWT is available
 */
export async function getSupabaseJWT(): Promise<string> {
  // Use the registered auth state handlers to get the token
  const token = authState.getToken();
  if (!token) throw new Error('No Supabase JWT available');
  return token;
}

// User search result type
export interface UserSearchResult {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  contactEmail?: string;
  isMember?: boolean;
}

export interface UserSearchResponse {
  users: UserSearchResult[];
}

/**
 * Search for users matching the provided text across username, email, contact email, and first/last name.
 *
 * Performs a backend search and returns matching users; can optionally scope results by trip membership.
 *
 * @param query - Search term (minimum 2 characters)
 * @param tripId - Optional trip ID to filter results to users associated with that trip
 * @param limit - Maximum number of results to return (default 10, maximum 20)
 * @returns An array of matching `UserSearchResult` objects
 */
export async function searchUsers(
  query: string,
  tripId?: string,
  limit: number = 10
): Promise<UserSearchResult[]> {
  const api = ApiClient.getInstance();
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (tripId) params.append('tripId', tripId);
  const response = await api
    .getAxiosInstance()
    .get<UserSearchResponse>(`${API_PATHS.users.search}?${params}`);
  return response.data.users;
}

/**
 * Updates the current user's contact email used for Apple Sign-In.
 *
 * @param email - The new contact email address to set for the current user
 * @returns The updated contact email object containing `contactEmail`
 */
export async function updateContactEmail(email: string): Promise<{ contactEmail: string }> {
  const api = ApiClient.getInstance();
  const response = await api
    .getAxiosInstance()
    .put<{ contactEmail: string }>(API_PATHS.users.updateContactEmail, { email });
  return response.data;
}