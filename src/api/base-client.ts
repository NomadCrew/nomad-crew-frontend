import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from './env';
import { ERROR_MESSAGES } from './constants';
import { logger } from '@/src/utils/logger';
import { ApiError } from './errors';

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
        if (__DEV__) {
          logger.debug('API', 'Request initiated:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data,
            headers: { 
              ...config.headers,
              Authorization: config.headers.Authorization ? config.headers.Authorization: undefined,
              apikey: config.headers.apikey ? config.headers.apikey : undefined 
            },
          });
        }
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
        if (__DEV__) {
          logger.debug('API', 'Response received:', {
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      (error: AxiosError) => {
        // If it's not an AxiosError (e.g., thrown from request interceptor), pass it through unchanged
        if (!error.isAxiosError) {
          return Promise.reject(error);
        }

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

        // Handle network errors - no response received
        if (!error.response) {
          const apiError = new ApiError(ERROR_MESSAGES.NETWORK_ERROR, undefined, 'NETWORK_ERROR');
          return Promise.reject(apiError);
        }

        // For 401 errors, pass through the original AxiosError so api-client can handle token refresh
        // The api-client interceptor needs access to error.response to check the error code
        if (error.response.status === 401) {
          return Promise.reject(error);
        }

        // Handle other status codes - convert to ApiError while preserving response
        const responseData = error.response.data as { message?: string; error?: string; code?: string };

        switch (error.response.status) {
          case 400:
            // Extract error message from response if available
            const badRequestMessage =
              responseData?.message ||
              responseData?.error ||
              'Bad request: The server could not process your request';
            return Promise.reject(ApiError.fromAxiosError(error, badRequestMessage));
          case 403:
            return Promise.reject(ApiError.fromAxiosError(error, ERROR_MESSAGES.FORBIDDEN));
          case 404:
            return Promise.reject(ApiError.fromAxiosError(error, ERROR_MESSAGES.NOT_FOUND));
          case 500:
            return Promise.reject(ApiError.fromAxiosError(error, ERROR_MESSAGES.SERVER_ERROR));
          default:
            return Promise.reject(
              ApiError.fromAxiosError(error, responseData?.message || ERROR_MESSAGES.UNEXPECTED)
            );
        }
      }
    );
  }

  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}
