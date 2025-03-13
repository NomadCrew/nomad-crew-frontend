export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://preview.nomadcrew.uk',
  // Add debug logging
  ...((__DEV__ && console.log('API_CONFIG.BASE_URL:', process.env.EXPO_PUBLIC_API_URL || 'https://preview.nomadcrew.uk')), {}),
  VERSION: process.env.EXPO_PUBLIC_API_VERSION || 'v1',
  TIMEOUT: 10000,
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3,
  WEBSOCKET: {
    PING_INTERVAL: 30000,
    PONG_TIMEOUT: 5000,
    MAX_MISSED_PONGS: 3,
    RECONNECT_ATTEMPTS: 5,
    CONNECTION_TIMEOUT: 10000
  }
} as const;