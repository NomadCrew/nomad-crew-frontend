import { BaseApiClient } from './base-client';
import { supabase } from '@/src/auth/supabaseClient';
import { useAuthStore } from '@/src/store/useAuthStore';
import { AxiosHeaders } from 'axios';
import { API_PATHS } from '@/src/utils/api-paths';
import { logger } from '@/src/utils/logger';

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
        // Wait for both initialization AND token availability
        let attempts = 0;
        const maxAttempts = 5; // Prevent infinite loop
        
        while ((!useAuthStore.getState().isInitialized || !useAuthStore.getState().token) && attempts < maxAttempts) {
          console.log('[API Client] Waiting for auth token...', {
            isInitialized: useAuthStore.getState().isInitialized,
            hasToken: !!useAuthStore.getState().token,
            attempt: attempts + 1
          });
          await new Promise(resolve => setTimeout(resolve, 200));
          attempts++;
        }
    
        const token = useAuthStore.getState().token;
        const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
        if (!token) {
          throw new Error('No auth token available after waiting');
        }
    
        const headers = new AxiosHeaders(config.headers);
        headers.set('Content-Type', 'application/json');
        headers.set('Accept', 'application/json');
        headers.set('Authorization', `Bearer ${token}`);
        headers.set('apikey', anonKey!);
        config.headers = headers;
    
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 2) If a 401 is received, handle token refresh and retry
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
  
        // Check if the error is a 401 Unauthorized and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Check for token expiration - either by explicit code or message
          const isTokenExpired = 
            error.response.data?.code === "token_expired" || 
            error.response.data?.message?.includes('token has expired');
          
          logger.debug('API', 'Received 401 error', {
            isTokenExpired,
            errorData: error.response.data,
            url: originalRequest.url
          });
          
          // If it's not a token expiration issue, just logout
          if (!isTokenExpired) {
            useAuthStore.getState().logout();
            return Promise.reject(error);
          }

          // Mark as retried to prevent infinite loops
          originalRequest._retry = true;
          
          try {
            logger.debug('API', 'Attempting to refresh token');
            
            // Use the refreshSession method from auth store
            await useAuthStore.getState().refreshSession();
            
            // Get the new token after refresh
            const newToken = useAuthStore.getState().token;
            
            if (!newToken) {
              throw new Error('Token refresh failed - no new token available');
            }
            
            logger.debug('API', 'Token refreshed successfully, retrying original request');
            
            // Update the Authorization header with the new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Retry the original request with the new token
            return this.api(originalRequest);
          } catch (refreshError) {
            logger.error('API', 'Token refresh failed:', refreshError);
            useAuthStore.getState().logout();
            return Promise.reject(refreshError);
          }
        }
  
        return Promise.reject(error);
      }
    );
  }
}

// Singleton
export const apiClient = ApiClient.getInstance();
export const api = apiClient.getAxiosInstance();
