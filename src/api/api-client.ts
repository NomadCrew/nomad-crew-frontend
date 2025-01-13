import { BaseApiClient } from './base-client';
import { supabase } from '@/src/auth/supabaseClient';
import { useAuthStore } from '@/src/store/useAuthStore';
import { AxiosHeaders } from 'axios';

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

    // 2) If a 401 slips through, you can sign out or handle it gracefully
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
  
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
  
          try {
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              // Token refresh failed, sign out the user
              useAuthStore.getState().logout();
              return Promise.reject(refreshError);
            }
  
            // Get the new access token from the store
            const token = useAuthStore.getState().token;
            if (token) {
              // Update the Authorization header and retry the request
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            } else {
              // No token available, sign out the user
              useAuthStore.getState().logout();
              return Promise.reject(new Error('No access token available'));
            }
          } catch (refreshError) {
            // Refresh token request failed
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
