import { Platform } from 'react-native';

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || (__DEV__ 
    ? Platform.select({
      android: 'http://10.0.2.2:8080',
      ios: 'http://localhost:8080',
      default: 'http://localhost:8080',
    })
    : ''),
  VERSION: process.env.EXPO_PUBLIC_API_VERSION || 'v1',
  TIMEOUT: 10000,
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3,
} as const;

export type ApiConfig = typeof API_CONFIG;