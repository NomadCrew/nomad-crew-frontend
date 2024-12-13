import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = __DEV__ 
  ? Platform.select({
      android: 'http://10.0.2.2:8080',
      ios: 'http://localhost:8080',
      default: 'http://localhost:8080',
    })
  : process.env.EXPO_PUBLIC_API_URL;

console.log('API Base URL:', BASE_URL);

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

// Add response interceptor with logging
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

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      switch (error.response.status) {
        case 401:
          // Handle unauthorized - maybe logout user
          await AsyncStorage.removeItem('auth_token');
          // You might want to trigger a navigation to login here
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        case 500:
          // Handle server error
          break;
      }
      return Promise.reject(new Error(error.response.data.message || 'An error occurred'));
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject(new Error('No response from server'));
    } else {
      // Something happened in setting up the request that triggered an Error
      return Promise.reject(new Error('Error setting up the request'));
    }
  }
);