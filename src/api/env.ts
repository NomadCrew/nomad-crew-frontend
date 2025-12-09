// Development API URL - update this to your machine's IP address
// Run: ipconfig getifaddr en0 to get your current IP
const DEV_API_URL = 'http://192.168.0.103:8080';

// Determine base URL: use local in dev mode, env var or production fallback otherwise
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
