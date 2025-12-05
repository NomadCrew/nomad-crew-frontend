/**
 * Custom API Error class for standardized error handling across the application.
 * Extends the native Error class to provide additional context about API failures.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Factory method to create an ApiError from an HTTP response
   * @param status - HTTP status code
   * @param data - Response data from the server
   * @returns ApiError instance
   */
  static fromResponse(status: number, data: unknown): ApiError {
    const errorData = data as { code?: string; message?: string } | undefined;
    return new ApiError(
      status,
      errorData?.code ?? 'UNKNOWN_ERROR',
      errorData?.message ?? 'An unknown error occurred',
      data
    );
  }

  /**
   * Check if the error is a network error (no response from server)
   */
  get isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR';
  }

  /**
   * Check if the error is an authentication error (401 or 403)
   */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /**
   * Check if the error is a server error (5xx status codes)
   */
  get isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * Check if the error is due to rate limiting (429)
   */
  get isRateLimited(): boolean {
    return this.status === 429;
  }

  /**
   * Convert the error to a plain object for serialization
   * Useful for logging and debugging
   */
  toJSON(): {
    name: string;
    message: string;
    status: number;
    code: string;
    data?: unknown;
  } {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      data: this.data,
    };
  }
}

/**
 * Type guard to check if an error is an ApiError instance
 * @param error - The error to check
 * @returns true if the error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
