import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from './env';
import { ERROR_MESSAGES } from './constants';

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
          console.log('🌐 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data,
            headers: { 
              ...config.headers,
              Authorization: config.headers.Authorization ? 'Bearer '+config.headers.Authorization: undefined,
              apikey: config.headers.apikey ? '[HIDDEN] ' + config.headers.apikey : undefined 
            },
          });
        }
        return config;
      },
      (error) => {
        if (__DEV__) {
          console.error('❌ Request Error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response logging and error handling interceptor
    this.api.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          console.log('✅ API Response:', {
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      (error: AxiosError) => {
        if (__DEV__) {
          console.error('❌ Response Error Details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
            requestHeaders: {
              ...error.config?.headers,
              Authorization: error.config?.headers?.Authorization ? 
                `Bearer ${(error.config.headers.Authorization as string).split(' ')[1].substring(0, 20)}...` : 
                undefined
            }
          });
        }

        // Handle network errors
        if (!error.response) {
          return Promise.reject(new Error(ERROR_MESSAGES.NETWORK_ERROR));
        }

        // Handle other status codes
        switch (error.response.status) {
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
