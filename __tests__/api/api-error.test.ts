import { ApiError, isApiError } from '../../src/types/api-error';

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create an ApiError instance with all properties', () => {
      const error = new ApiError(404, 'NOT_FOUND', 'Resource not found');

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(Error);
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.name).toBe('ApiError');
      expect(error.data).toBeUndefined();
    });

    it('should create an ApiError instance with optional data', () => {
      const errorData = { details: 'Additional error information' };
      const error = new ApiError(400, 'BAD_REQUEST', 'Invalid input', errorData);

      expect(error.status).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Invalid input');
      expect(error.data).toEqual(errorData);
    });

    it('should have a proper stack trace', () => {
      const error = new ApiError(500, 'SERVER_ERROR', 'Internal error');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });

  describe('fromResponse', () => {
    it('should create ApiError from response data with code and message', () => {
      const responseData = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input provided',
      };
      const error = ApiError.fromResponse(400, responseData);

      expect(error.status).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input provided');
      expect(error.data).toEqual(responseData);
    });

    it('should use default values when response data is missing code and message', () => {
      const error = ApiError.fromResponse(500, {});

      expect(error.status).toBe(500);
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.message).toBe('An unknown error occurred');
    });

    it('should handle undefined response data', () => {
      const error = ApiError.fromResponse(503, undefined);

      expect(error.status).toBe(503);
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.message).toBe('An unknown error occurred');
    });

    it('should handle response data with only code', () => {
      const responseData = { code: 'CUSTOM_ERROR' };
      const error = ApiError.fromResponse(400, responseData);

      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.message).toBe('An unknown error occurred');
    });

    it('should handle response data with only message', () => {
      const responseData = { message: 'Custom error message' };
      const error = ApiError.fromResponse(400, responseData);

      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.message).toBe('Custom error message');
    });
  });

  describe('isNetworkError', () => {
    it('should return true for network errors', () => {
      const error = new ApiError(0, 'NETWORK_ERROR', 'No connection');

      expect(error.isNetworkError).toBe(true);
      expect(error.isAuthError).toBe(false);
      expect(error.isServerError).toBe(false);
    });

    it('should return false for non-network errors', () => {
      const error = new ApiError(404, 'NOT_FOUND', 'Not found');

      expect(error.isNetworkError).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('should return true for 401 Unauthorized', () => {
      const error = new ApiError(401, 'UNAUTHORIZED', 'Invalid token');

      expect(error.isAuthError).toBe(true);
      expect(error.isNetworkError).toBe(false);
      expect(error.isServerError).toBe(false);
    });

    it('should return true for 403 Forbidden', () => {
      const error = new ApiError(403, 'FORBIDDEN', 'Access denied');

      expect(error.isAuthError).toBe(true);
    });

    it('should return false for non-auth errors', () => {
      const error400 = new ApiError(400, 'BAD_REQUEST', 'Bad request');
      const error404 = new ApiError(404, 'NOT_FOUND', 'Not found');
      const error500 = new ApiError(500, 'SERVER_ERROR', 'Server error');

      expect(error400.isAuthError).toBe(false);
      expect(error404.isAuthError).toBe(false);
      expect(error500.isAuthError).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true for 500 Internal Server Error', () => {
      const error = new ApiError(500, 'SERVER_ERROR', 'Internal error');

      expect(error.isServerError).toBe(true);
      expect(error.isAuthError).toBe(false);
      expect(error.isNetworkError).toBe(false);
    });

    it('should return true for 502 Bad Gateway', () => {
      const error = new ApiError(502, 'BAD_GATEWAY', 'Bad gateway');

      expect(error.isServerError).toBe(true);
    });

    it('should return true for 503 Service Unavailable', () => {
      const error = new ApiError(503, 'SERVICE_UNAVAILABLE', 'Service unavailable');

      expect(error.isServerError).toBe(true);
    });

    it('should return true for 504 Gateway Timeout', () => {
      const error = new ApiError(504, 'GATEWAY_TIMEOUT', 'Gateway timeout');

      expect(error.isServerError).toBe(true);
    });

    it('should return false for non-server errors', () => {
      const error400 = new ApiError(400, 'BAD_REQUEST', 'Bad request');
      const error404 = new ApiError(404, 'NOT_FOUND', 'Not found');
      const error499 = new ApiError(499, 'CLIENT_ERROR', 'Client error');

      expect(error400.isServerError).toBe(false);
      expect(error404.isServerError).toBe(false);
      expect(error499.isServerError).toBe(false);
    });
  });

  describe('isRateLimited', () => {
    it('should return true for 429 Too Many Requests', () => {
      const error = new ApiError(429, 'RATE_LIMITED', 'Too many requests');

      expect(error.isRateLimited).toBe(true);
    });

    it('should return false for non-rate-limit errors', () => {
      const error400 = new ApiError(400, 'BAD_REQUEST', 'Bad request');
      const error401 = new ApiError(401, 'UNAUTHORIZED', 'Unauthorized');
      const error500 = new ApiError(500, 'SERVER_ERROR', 'Server error');

      expect(error400.isRateLimited).toBe(false);
      expect(error401.isRateLimited).toBe(false);
      expect(error500.isRateLimited).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly without data', () => {
      const error = new ApiError(404, 'NOT_FOUND', 'Resource not found');
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'ApiError',
        message: 'Resource not found',
        status: 404,
        code: 'NOT_FOUND',
        data: undefined,
      });
    });

    it('should serialize to JSON correctly with data', () => {
      const errorData = { field: 'email', reason: 'invalid format' };
      const error = new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', errorData);
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'ApiError',
        message: 'Validation failed',
        status: 400,
        code: 'VALIDATION_ERROR',
        data: errorData,
      });
    });

    it('should be usable with JSON.stringify', () => {
      const error = new ApiError(500, 'SERVER_ERROR', 'Internal error');
      const jsonString = JSON.stringify(error);
      const parsed = JSON.parse(jsonString);

      expect(parsed.name).toBe('ApiError');
      expect(parsed.message).toBe('Internal error');
      expect(parsed.status).toBe(500);
      expect(parsed.code).toBe('SERVER_ERROR');
    });
  });
});

describe('isApiError', () => {
  it('should return true for ApiError instances', () => {
    const error = new ApiError(400, 'BAD_REQUEST', 'Bad request');

    expect(isApiError(error)).toBe(true);
  });

  it('should return false for regular Error instances', () => {
    const error = new Error('Regular error');

    expect(isApiError(error)).toBe(false);
  });

  it('should return false for TypeError instances', () => {
    const error = new TypeError('Type error');

    expect(isApiError(error)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isApiError(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isApiError(undefined)).toBe(false);
  });

  it('should return false for string', () => {
    expect(isApiError('error string')).toBe(false);
  });

  it('should return false for plain objects', () => {
    const errorLike = {
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Bad request',
    };

    expect(isApiError(errorLike)).toBe(false);
  });

  it('should return false for objects with similar shape', () => {
    const errorLike = {
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Bad request',
      name: 'ApiError',
      isNetworkError: false,
      isAuthError: false,
      isServerError: false,
    };

    expect(isApiError(errorLike)).toBe(false);
  });
});
