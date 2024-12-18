export const ERROR_MESSAGES = {
    FORBIDDEN: 'You do not have permission to perform this action',
    NOT_FOUND: 'The requested resource was not found',
    SERVER_ERROR: 'An internal server error occurred',
    NETWORK_ERROR: 'No response from server. Please check your connection.',
    SESSION_EXPIRED: 'Session expired. Please login again.',
    UNEXPECTED: 'An unexpected error occurred',
    RATE_LIMITED: 'Too many requests. Please try again later.',
  } as const;