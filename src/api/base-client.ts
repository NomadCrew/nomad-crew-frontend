import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { API_CONFIG } from './env';
import { ERROR_MESSAGES, ERROR_CODES, ApiError } from './constants';
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

        // Handle network errors (no response from server)
        if (!error.response) {
          const networkError = new ApiError(
            0,
            ERROR_CODES.NETWORK_ERROR,
            ERROR_MESSAGES.NETWORK_ERROR
          );
          return Promise.reject(networkError);
        }

        const status = error.response.status;
        const responseData = error.response.data;

        // Handle other status codes - transform to ApiError
        switch (status) {
          case 400:
            // Extract error message from response if available
            const badRequestMessage =
              (responseData as { message?: string; error?: string })?.message ||
              (responseData as { message?: string; error?: string })?.error ||
              'Bad request: The server could not process your request';
            const badRequestCode = (responseData as { code?: string })?.code || 'BAD_REQUEST';
            return Promise.reject(
              new ApiError(status, badRequestCode, badRequestMessage, responseData)
            );

          case 403:
            return Promise.reject(
              new ApiError(status, 'FORBIDDEN', ERROR_MESSAGES.FORBIDDEN, responseData)
            );

          case 404:
            return Promise.reject(
              new ApiError(status, 'NOT_FOUND', ERROR_MESSAGES.NOT_FOUND, responseData)
            );

          case 429:
            return Promise.reject(
              new ApiError(status, 'RATE_LIMITED', ERROR_MESSAGES.RATE_LIMITED, responseData)
            );

          case 500:
            return Promise.reject(
              new ApiError(status, 'SERVER_ERROR', ERROR_MESSAGES.SERVER_ERROR, responseData)
            );

          default:
            // For any other status, try to use response data or fallback
            const message =
              (responseData as { message?: string })?.message || ERROR_MESSAGES.UNEXPECTED;
            const code = (responseData as { code?: string })?.code || 'UNKNOWN_ERROR';
            return Promise.reject(new ApiError(status, code, message, responseData));
        }
      }
    );
  }

  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}
