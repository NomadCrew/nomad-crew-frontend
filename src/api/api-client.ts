import { BaseApiClient } from './base-client';
import { router } from 'expo-router';
import type { TokenManager } from '@/src/auth/types';
import { ERROR_MESSAGES } from './constants';
import type { AxiosError } from 'axios';

export class ApiClient extends BaseApiClient {
  private static instance: ApiClient;
  private tokenManager: TokenManager | null = null;
  private refreshPromise: Promise<string> | null = null;
  private unauthorizedCallback: (() => void) | null = null;

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

  public setTokenManager(tokenManager: TokenManager): void {
    this.tokenManager = tokenManager;
  }

  public setUnauthorizedCallback(callback: () => void): void {
    this.unauthorizedCallback = callback;
  }

  private setupAuthInterceptors(): void {
    // Auth Request Interceptor
    this.api.interceptors.request.use(
      async (config) => {
        try {
          if (this.tokenManager) {
            const token = await this.tokenManager.getToken();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
          return config;
        } catch (error) {
          console.error('Failed to get token:', error);
          return config;
        }
      },
      (error) => Promise.reject(error)
    );

    // Auth Response Interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        if (!originalRequest) {
          return Promise.reject(error);
        }

        // Handle 401 Unauthorized with token refresh
        if (error.response?.status === 401 && !originalRequest._retry && this.tokenManager) {
          originalRequest._retry = true;

          try {
            if (!this.refreshPromise) {
              this.refreshPromise = this.tokenManager.refreshToken();
            }

            const newToken = await this.refreshPromise;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            return this.api(originalRequest);
          } catch (refreshError) {
            this.refreshPromise = null;
            if (this.tokenManager) {
              await this.tokenManager.clearTokens();
            }
            
            if (this.unauthorizedCallback) {
              this.unauthorizedCallback();
            } else {
              router.replace('/login');
            }
            return Promise.reject(new Error(ERROR_MESSAGES.SESSION_EXPIRED));
          } finally {
            this.refreshPromise = null;
          }
        }

        return Promise.reject(error);
      }
    );
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();
export const api = apiClient.getAxiosInstance();

// Type for config with retry count
declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
    _retryCount?: number;
  }
}