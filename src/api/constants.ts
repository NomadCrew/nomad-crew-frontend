export const ERROR_MESSAGES = {
    FORBIDDEN: 'You do not have permission to perform this action',
    NOT_FOUND: 'The requested resource was not found',
    SERVER_ERROR: 'An internal server error occurred',
    NETWORK_ERROR: 'No response from server. Please check your connection.',
    SESSION_EXPIRED: 'Session expired. Please login again.',
    UNEXPECTED: 'An unexpected error occurred',
    RATE_LIMITED: 'Too many requests. Please try again later.',
    TOKEN_EXPIRED: 'Your session has expired. Please wait while we refresh your session.',
    REFRESH_FAILED: 'Failed to refresh your session. Please login again.',
    INVALID_REFRESH_TOKEN: 'Your session has expired. Please login again.',
  } as const;

// Error codes from the backend
export const ERROR_CODES = {
  TOKEN_EXPIRED: 'token_expired',
  INVALID_REFRESH_TOKEN: 'invalid_refresh_token',
  REFRESH_FAILED: 'refresh_failed',
  INVALID_REQUEST: 'invalid_request',
} as const;