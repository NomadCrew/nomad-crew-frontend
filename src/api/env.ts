// Determine if we're in development mode
const isDev = __DEV__;

// Get the API URL from environment variables with fallback
const getApiUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const defaultUrl = 'https://api.nomadcrew.uk';

  if (envUrl) {
    if (isDev) {
      console.log('[API Config] Using environment API URL:', envUrl);
    }
    return envUrl;
  }

  if (isDev) {
    console.log('[API Config] No EXPO_PUBLIC_API_URL set, using default:', defaultUrl);
  }
  return defaultUrl;
};

export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  VERSION: process.env.EXPO_PUBLIC_API_VERSION || 'v1',
  TIMEOUT: 15000, // Increased for slower connections
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

// Log full config in development for debugging
if (isDev) {
  console.log('[API Config] Full configuration:', {
    BASE_URL: API_CONFIG.BASE_URL,
    VERSION: API_CONFIG.VERSION,
    TIMEOUT: API_CONFIG.TIMEOUT,
    WEBSOCKET_URL: API_CONFIG.BASE_URL.replace(/^http/, 'ws') + '/v1/ws',
  });
}