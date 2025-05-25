import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from './env';
import { ERROR_MESSAGES } from './constants';
import { logger } from '@/src/utils/logger';

export class BaseApiClient {
  protected api: AxiosInstance;

  constructor(config?: Partial<AxiosRequestConfig>) {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    });

    this.setupBaseInterceptors();
  }

  private setupBaseInterceptors(): void {
    // Request logging interceptor
    this.api.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        if (__DEV__) {
          logger.error('API', 'Request Error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response logging and error handling interceptor
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: AxiosError) => {
        logger.error('API', 'Request failed:', {
          message: error.message,
          code: error.code,
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
          // Add these additional debug fields
          config: {
            baseURL: error.config?.baseURL,
            headers: error.config?.headers,
            method: error.config?.method,
          },
          // Network error details
          isAxiosError: error.isAxiosError,
          stack: error.stack,
          cause: error.cause
        });

        // Handle network errors
        if (!error.response) {
          return Promise.reject(new Error(ERROR_MESSAGES.NETWORK_ERROR));
        }

        // Create enhanced error that preserves original status and response
        const createEnhancedError = (message: string, originalError: AxiosError) => {
          const enhancedError = new Error(message) as Error & {
            response?: AxiosError['response'];
            status?: number;
            originalError?: AxiosError;
          };
          enhancedError.response = originalError.response;
          enhancedError.status = originalError.response?.status;
          enhancedError.originalError = originalError;
          return enhancedError;
        };

        // Handle other status codes
        switch (error.response.status) {
          case 400:
            // Extract error message from response if available
            const badRequestMessage = 
              (error.response.data as { message?: string; error?: string })?.message || 
              (error.response.data as { message?: string; error?: string })?.error || 
              'Bad request: The server could not process your request';
            return Promise.reject(createEnhancedError(badRequestMessage, error));
          case 401:
            const unauthorizedMessage = 
              (error.response.data as { message?: string })?.message || 
              'Unauthorized: Authentication required';
            return Promise.reject(createEnhancedError(unauthorizedMessage, error));
          case 403:
            return Promise.reject(createEnhancedError(ERROR_MESSAGES.FORBIDDEN, error));
          case 404:
            return Promise.reject(createEnhancedError(ERROR_MESSAGES.NOT_FOUND, error));
          case 500:
            return Promise.reject(createEnhancedError(ERROR_MESSAGES.SERVER_ERROR, error));
          default:
            const defaultMessage = (error.response.data as { message?: string })?.message || ERROR_MESSAGES.UNEXPECTED;
            return Promise.reject(createEnhancedError(defaultMessage, error));
        }
      }
    );
  }

  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}
