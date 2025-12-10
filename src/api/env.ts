// Development API URL - reads from env var or uses localhost fallback
// Set EXPO_PUBLIC_DEV_API_URL in .env for development (e.g., http://192.168.1.100:8080)
const DEV_API_URL = process.env.EXPO_PUBLIC_DEV_API_URL || 'http://localhost:8080';

// Determine base URL: use DEV_API_URL in dev mode, EXPO_PUBLIC_API_URL or production fallback otherwise
const getBaseUrl = (): string => {
  if (__DEV__) {
    console.log('🔧 DEV MODE: Using local API URL:', DEV_API_URL);
    return DEV_API_URL;
  }
  return process.env.EXPO_PUBLIC_API_URL || 'https://api.nomadcrew.uk';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  VERSION: process.env.EXPO_PUBLIC_API_VERSION || 'v1',
  TIMEOUT: 10000,
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3,
  WEBSOCKET: {
    PING_INTERVAL: 30000,
    PONG_TIMEOUT: 5000,
    MAX_MISSED_PONGS: 3,
    RECONNECT_ATTEMPTS: 5,
    CONNECTION_TIMEOUT: 10000,
  },
} as const;
