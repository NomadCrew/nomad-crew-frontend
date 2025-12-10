import { AxiosError, AxiosResponse } from 'axios';

/**
 * Custom API Error class that preserves the original Axios response
 * This allows error handlers to access status codes, headers, and response data
 */
export class ApiError extends Error {
  public readonly response?: AxiosResponse;
  public readonly status?: number;
  public readonly code?: string;
  public readonly isApiError = true;

  constructor(
    message: string,
    response?: AxiosResponse,
    code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.response = response;
    this.status = response?.status;
    this.code = code;

    // Maintains proper stack trace for where error was thrown (only in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Create an ApiError from an AxiosError
   */
  static fromAxiosError(error: AxiosError, message?: string): ApiError {
    const responseData = error.response?.data as { message?: string; error?: string; code?: string } | undefined;
    const errorMessage = message ||
      responseData?.message ||
      responseData?.error ||
      error.message;
    const errorCode = responseData?.code;

    return new ApiError(errorMessage, error.response, errorCode);
  }

  /**
   * Check if an error is an ApiError
   */
  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError || (error as ApiError)?.isApiError === true;
  }
}
