import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
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

    this.setupRetryLogic();
    this.setupBaseInterceptors();
  }

  private setupRetryLogic(): void {
    axiosRetry(this.api, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        // Retry on network errors
        if (axiosRetry.isNetworkError(error)) {
          return true;
        }

        // Retry on 5xx server errors and 429 (rate limit)
        if (error.response) {
          const status = error.response.status;
          return status >= 500 || status === 429;
        }

        return false;
      },
      onRetry: (retryCount, error, requestConfig) => {
        logger.warn('API', `Retry attempt ${retryCount} for ${requestConfig.url}`, {
          error: error.message,
          status: error.response?.status,
        });
      },
    });
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
          cause: error.cause,
        });

        // Handle network errors
        if (!error.response) {
          return Promise.reject(new Error(ERROR_MESSAGES.NETWORK_ERROR));
        }

        // Handle other status codes
        switch (error.response.status) {
          case 400:
            // Extract error message from response if available
            const badRequestMessage =
              (error.response.data as { message?: string; error?: string })?.message ||
              (error.response.data as { message?: string; error?: string })?.error ||
              'Bad request: The server could not process your request';
            return Promise.reject(new Error(badRequestMessage));
          case 403:
            return Promise.reject(new Error(ERROR_MESSAGES.FORBIDDEN));
          case 404:
            return Promise.reject(new Error(ERROR_MESSAGES.NOT_FOUND));
          case 500:
            return Promise.reject(new Error(ERROR_MESSAGES.SERVER_ERROR));
          default:
            return Promise.reject(
              new Error(
                (error.response.data as { message?: string })?.message || ERROR_MESSAGES.UNEXPECTED
              )
            );
        }
      }
    );
  }

  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}
