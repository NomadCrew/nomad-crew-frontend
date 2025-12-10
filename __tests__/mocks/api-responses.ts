/**
 * API Error Response Mocks
 *
 * Standard error response formats matching the backend API specification.
 * Use these to simulate API error responses in tests.
 *
 * @see docs/03-reference/backend/api/error-handling.md
 */

/**
 * Creates a standard error response object.
 *
 * @param type - Error type (e.g., 'VALIDATION_ERROR', 'AUTH_ERROR')
 * @param code - Specific error code
 * @param message - Human-readable error message
 * @param details - Additional error details
 * @returns A standard error response object
 *
 * @example
 * const error = createErrorResponse(
 *   'VALIDATION_ERROR',
 *   'VALIDATION_FAILED',
 *   'The request contains invalid data',
 *   { fields: { email: 'Invalid email format' } }
 * );
 */
export const createErrorResponse = (
  type: string,
  code: string,
  message: string,
  details?: any
) => ({
  type,
  code,
  message,
  details,
});

/**
 * Creates a validation error response.
 *
 * @param fields - Map of field names to error messages
 * @returns A validation error response
 *
 * @example
 * const error = VALIDATION_ERROR({
 *   email: 'Invalid email format',
 *   password: 'Password must be at least 8 characters'
 * });
 */
export const VALIDATION_ERROR = (fields: Record<string, string>) =>
  createErrorResponse(
    'VALIDATION_ERROR',
    'VALIDATION_FAILED',
    'The request contains invalid data',
    { fields }
  );

/**
 * Creates an authentication error response.
 *
 * @param code - Specific auth error code
 * @param message - Error message
 * @returns An authentication error response
 *
 * @example
 * const error = AUTH_ERROR('INVALID_CREDENTIALS', 'Invalid email or password');
 */
export const AUTH_ERROR = (code: string, message: string) =>
  createErrorResponse('AUTH_ERROR', code, message);

/**
 * Creates a rate limit error response.
 *
 * @param retryAfter - Seconds until rate limit resets
 * @returns A rate limit error response
 *
 * @example
 * const error = RATE_LIMIT_ERROR(60);
 */
export const RATE_LIMIT_ERROR = (retryAfter: number) =>
  createErrorResponse(
    'RATE_LIMIT_ERROR',
    'RATE_LIMITED',
    `Too many requests. Please try again in ${retryAfter} seconds.`,
    { retryAfter }
  );

/**
 * Common authentication errors
 */
export const COMMON_AUTH_ERRORS = {
  INVALID_CREDENTIALS: AUTH_ERROR('INVALID_CREDENTIALS', 'Invalid email or password'),
  EMAIL_ALREADY_EXISTS: AUTH_ERROR('EMAIL_ALREADY_EXISTS', 'An account with this email already exists'),
  INVALID_TOKEN: AUTH_ERROR('INVALID_TOKEN', 'Invalid or expired authentication token'),
  UNAUTHORIZED: AUTH_ERROR('UNAUTHORIZED', 'You must be logged in to access this resource'),
  SESSION_EXPIRED: AUTH_ERROR('SESSION_EXPIRED', 'Your session has expired. Please log in again.'),
};

/**
 * Common resource errors
 */
export const COMMON_RESOURCE_ERRORS = {
  NOT_FOUND: createErrorResponse('RESOURCE_ERROR', 'NOT_FOUND', 'The requested resource was not found'),
  FORBIDDEN: createErrorResponse('RESOURCE_ERROR', 'FORBIDDEN', 'You do not have permission to access this resource'),
  CONFLICT: createErrorResponse('RESOURCE_ERROR', 'CONFLICT', 'The request conflicts with the current state of the resource'),
};

/**
 * Common server errors
 */
export const COMMON_SERVER_ERRORS = {
  INTERNAL_ERROR: createErrorResponse('SERVER_ERROR', 'INTERNAL_ERROR', 'An unexpected error occurred. Please try again later.'),
  SERVICE_UNAVAILABLE: createErrorResponse('SERVER_ERROR', 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again later.'),
};

/**
 * Creates a network error (simulates no response from server).
 *
 * @param message - Error message (optional)
 * @returns A network error object
 *
 * @example
 * const error = NETWORK_ERROR('Failed to connect to server');
 */
export const NETWORK_ERROR = (message: string = 'Network request failed') => ({
  message,
  name: 'NetworkError',
  isNetworkError: true,
});
