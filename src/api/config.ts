import axios from 'axios';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { secureTokenManager } from '@/src/auth/secure-token-manager';

type UnauthorizedCallback = () => void;

// Constants for configuration
const CONFIG = {
  TIMEOUT: 10000,
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3,
} as const;

// Error messages
const ERROR_MESSAGES = {
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  SERVER_ERROR: 'An internal server error occurred',
  NETWORK_ERROR: 'No response from server. Please check your connection.',
  SESSION_EXPIRED: 'Session expired. Please login again.',
  UNEXPECTED: 'An unexpected error occurred',
  RATE_LIMITED: 'Too many requests. Please try again later.',
} as const;

const BASE_URL = __DEV__ 
  ? Platform.select({
      android: 'http://10.0.2.2:8080',
      ios: 'http://localhost:8080',
      default: 'http://localhost:8080',
    })
  : process.env.EXPO_PUBLIC_API_URL;

// Unauthorized callback
let unauthorizedCallback: UnauthorizedCallback | null = null;

export function setUnauthorizedCallback(callback: UnauthorizedCallback) {
  unauthorizedCallback = callback;
}

// Create axios instance with retry capability
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track ongoing refresh token promise
let refreshTokenPromise: Promise<string> | null = null;

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await secureTokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (__DEV__) {
        console.log('🌐 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
          headers: { ...config.headers, Authorization: token ? 'Bearer [HIDDEN]' : undefined },
        });
      }
      return config;
    } catch (error) {
      // If token retrieval fails, proceed without token
      console.error('Failed to get token:', error);
      return config;
    }
  },
  (error) => {
    if (__DEV__) {
      console.error('❌ Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('✅ API Response:', {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      console.error('❌ Response Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    }

    const originalRequest = error.config;

    // Handle 401 Unauthorized with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Use existing refresh promise if one is in progress
        if (!refreshTokenPromise) {
          refreshTokenPromise = secureTokenManager.refreshToken();
        }

        await refreshTokenPromise;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Clear refresh promise
        refreshTokenPromise = null;
        await secureTokenManager.clearTokens();
        
        // If refresh fails, clear tokens and redirect to login
        await secureTokenManager.clearTokens();
        router.replace('/login');
        return Promise.reject(new Error(ERROR_MESSAGES.SESSION_EXPIRED));
      } finally {
        refreshTokenPromise = null;
      }
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter && !originalRequest._retryCount) {
        originalRequest._retryCount = 1;
        await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
        return api(originalRequest);
      }
      return Promise.reject(new Error(ERROR_MESSAGES.RATE_LIMITED));
    }

    // Handle other error statuses
    if (error.response) {
      switch (error.response.status) {
        case 403:
          return Promise.reject(new Error(ERROR_MESSAGES.FORBIDDEN));
        case 404:
          return Promise.reject(new Error(ERROR_MESSAGES.NOT_FOUND));
        case 500:
          return Promise.reject(new Error(ERROR_MESSAGES.SERVER_ERROR));
        default:
          return Promise.reject(
            new Error(error.response.data?.message || ERROR_MESSAGES.UNEXPECTED)
          );
      }
    }
    
    // Handle network errors
    if (error.request) {
      return Promise.reject(new Error(ERROR_MESSAGES.NETWORK_ERROR));
    }
    
    // Handle other errors
    return Promise.reject(new Error(ERROR_MESSAGES.UNEXPECTED));
  }
);

// Optional: Add request retry functionality
api.interceptors.response.use(
  response => response,
  async error => {
    const { config } = error;
    
    // Only retry on network errors and 5xx errors
    if (!config || !error.response || 
        error.response.status < 500 || 
        config._retryCount >= CONFIG.MAX_RETRIES) {
      return Promise.reject(error);
    }

    // Increment retry count
    config._retryCount = (config._retryCount || 0) + 1;

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));

    return api(config);
  }
);