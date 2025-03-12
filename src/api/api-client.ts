import { BaseApiClient } from './base-client';
import { supabase } from '@/src/auth/supabaseClient';
import { AxiosHeaders, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_PATHS } from '@/src/utils/api-paths';
import { logger } from '@/src/utils/logger';
import { ERROR_CODES, ERROR_MESSAGES } from './constants';
import { isTokenExpiringSoon } from '@/src/utils/token';

// Token refresh lock mechanism
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

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
const processQueue = (error: Error | null, token: string | null = null) => {
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
        // Skip auth for public endpoints
        const isPublicEndpoint = [
          API_PATHS.auth.login,
          API_PATHS.auth.register,
          API_PATHS.auth.refresh
        ].some(path => config.url?.includes(path));
        
        if (isPublicEndpoint) {
          return config;
        }
        
        // Wait for both initialization AND token availability
        let attempts = 0;
        const maxAttempts = 5; // Prevent infinite loop
        
        while ((!authState.isInitialized() || !authState.getToken()) && attempts < maxAttempts) {
          logger.debug('API Client', 'Waiting for auth token...', {
            isInitialized: authState.isInitialized(),
            hasToken: !!authState.getToken(),
            attempt: attempts + 1
          });
          await new Promise(resolve => setTimeout(resolve, 200));
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
            errorData?.code === ERROR_CODES.TOKEN_EXPIRED || 
            errorData?.refresh_required === true;
          
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
                }
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
