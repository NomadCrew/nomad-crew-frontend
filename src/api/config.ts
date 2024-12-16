import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { router } from 'expo-router';

const BASE_URL = __DEV__ 
  ? Platform.select({
      android: 'http://10.0.2.2:8080',
      ios: 'http://localhost:8080',
      default: 'http://localhost:8080',
    })
  : process.env.EXPO_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Add request interceptor with logging
api.interceptors.request.use(
  async (config) => {
    if (__DEV__) {
      console.log('🌐 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        headers: config.headers,
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

// Handle unauthorized responses
let isRedirecting = false;

const handleUnauthorized = async () => {
  if (!isRedirecting) {
    isRedirecting = true;
    // Clear auth data
    await AsyncStorage.removeItem('auth_token');
    delete api.defaults.headers.common['Authorization'];
    
    // Reset redirect flag after a short delay
    setTimeout(() => {
      isRedirecting = false;
    }, 1000);

    // Redirect to login
    router.replace('/login');
  }
};

let unauthorizedCallback: (() => void) | null = null;

export const setUnauthorizedCallback = (callback: () => void) => {
  unauthorizedCallback = callback;
};

// Add response interceptor with logging and auth handling
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('✅ API Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
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
        headers: error.response?.headers,
      });
    }

    // Handle 401 Unauthorized globally
    if (error.response?.status === 401) {
      // Clear auth data
      await AsyncStorage.removeItem('auth_token');
      delete api.defaults.headers.common['Authorization'];
      
      // Call the unauthorized callback if set
      if (unauthorizedCallback) {
        unauthorizedCallback();
      }

      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    if (error.response) {
      switch (error.response.status) {
        case 403:
          // Handle forbidden
          return Promise.reject(new Error('You do not have permission to perform this action'));
        case 404:
          // Handle not found
          return Promise.reject(new Error('The requested resource was not found'));
        case 500:
          // Handle server error
          return Promise.reject(new Error('An internal server error occurred'));
        default:
          return Promise.reject(new Error(error.response.data.message || 'An error occurred'));
      }
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject(new Error('No response from server'));
    } else {
      // Something happened in setting up the request
      return Promise.reject(new Error('Error setting up the request'));
    }
  }
);