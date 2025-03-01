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
        logger.error('API', 'Request failed:', {
          message: error.message,
          code: error.code,
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data
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
              new Error((error.response.data as { message?: string })?.message || ERROR_MESSAGES.UNEXPECTED)
            );
        }
      }
    );
  }

  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}
