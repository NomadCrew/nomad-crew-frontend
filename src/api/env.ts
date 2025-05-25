export const API_CONFIG = {
  ...((__DEV__ && console.log('API_CONFIG.BASE_URL:', process.env.EXPO_PUBLIC_API_URL || 'https://api.nomadcrew.uk')), {}),
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.nomadcrew.uk',
  VERSION: process.env.EXPO_PUBLIC_API_VERSION || 'v1',
  TIMEOUT: 10000,
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3,
} as const;