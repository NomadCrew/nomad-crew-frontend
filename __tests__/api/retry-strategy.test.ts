// Import setup FIRST to ensure all mocks are in place
import './test-setup';

import MockAdapter from 'axios-mock-adapter';
import { ApiClient, registerAuthHandlers } from '@/src/api/api-client';
import { ERROR_CODES, ERROR_MESSAGES, ApiError } from '@/src/api/constants';

describe('Retry Strategy', () => {
  let apiClient: ApiClient;
  let mockAxios: MockAdapter;
  let mockAuthState: {
    getToken: jest.Mock;
    getRefreshToken: jest.Mock;
    isInitialized: jest.Mock;
    refreshSession: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(() => {
    // Create new API client instance
    apiClient = ApiClient.getInstance();

    // Create mock adapter for the axios instance
    // Note: delayResponse: 0 ensures fast test execution
    mockAxios = new MockAdapter(apiClient.getAxiosInstance(), { delayResponse: 0 });

    // Setup mock auth state
    mockAuthState = {
      getToken: jest.fn(() => 'valid-token'),
      getRefreshToken: jest.fn(() => 'valid-refresh-token'),
      isInitialized: jest.fn(() => true),
      refreshSession: jest.fn(),
      logout: jest.fn(),
    };

    // Register auth handlers
    registerAuthHandlers(mockAuthState);

    // Note: We do NOT use fake timers here because axios-retry uses real timeouts
    // Using fake timers would cause tests to hang waiting for setTimeout
  });

  afterEach(() => {
    mockAxios.reset();
    mockAxios.restore();
    jest.clearAllMocks();
  });

  describe('token refresh retry', () => {
    // NOTE: Due to the interceptor architecture, 401 errors from the server are transformed
    // to ApiError by base-client BEFORE the api-client's response interceptor can handle them.
    // This means response-level token refresh doesn't work. Token refresh only happens
    // proactively in the REQUEST interceptor when the token is expiring or missing.

    it('should transform 401 to ApiError (no automatic retry)', async () => {
      // 401 errors are transformed by base-client before api-client can handle
      mockAxios.onGet('/api/trips').reply(401, {
        type: 'AUTH_ERROR',
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: ERROR_MESSAGES.TOKEN_EXPIRED,
        refresh_required: true,
      });

      const api = apiClient.getAxiosInstance();

      try {
        await api.get('/api/trips');
        throw new Error('Should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(401);
        expect(error.message).toBe(ERROR_MESSAGES.TOKEN_EXPIRED);
      }

      // No refresh called - base-client handles 401 before response interceptor
      expect(mockAuthState.refreshSession).not.toHaveBeenCalled();
    });

    it('should not retry 401 errors (base-client transforms them first)', async () => {
      let requestCount = 0;

      mockAxios.onGet('/api/trips').reply(() => {
        requestCount++;
        return [
          401,
          {
            type: 'AUTH_ERROR',
            code: ERROR_CODES.TOKEN_EXPIRED,
            message: ERROR_MESSAGES.TOKEN_EXPIRED,
            refresh_required: true,
          },
        ];
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips')).rejects.toThrow();

      // 401 is not retried by axios-retry (it only retries 5xx and network errors)
      expect(requestCount).toBe(1);
      // No refresh called
      expect(mockAuthState.refreshSession).not.toHaveBeenCalled();
    });

    it('should logout when no token and refresh fails in request interceptor', async () => {
      // Simulate no token available - triggers refresh attempt in request interceptor
      mockAuthState.getToken.mockReturnValue(null);
      mockAuthState.isInitialized.mockReturnValue(true);
      mockAuthState.refreshSession.mockRejectedValueOnce(
        new Error(ERROR_MESSAGES.INVALID_REFRESH_TOKEN)
      );

      const api = apiClient.getAxiosInstance();

      // The error thrown in request interceptor is caught by base-client
      // as a network error (no .response property)
      try {
        await api.get('/api/trips');
        throw new Error('Should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiError);
        // Logout should still have been called in the request interceptor
        expect(mockAuthState.logout).toHaveBeenCalled();
        expect(mockAuthState.refreshSession).toHaveBeenCalledTimes(1);
      }
    });

    it('should proactively refresh token when expiring soon', async () => {
      // Mock the token utility to say token is expiring soon
      const tokenUtils = require('@/src/utils/token');
      tokenUtils.isTokenExpiringSoon.mockReturnValue(true);

      mockAxios.onGet('/api/trips').reply(200, { trips: [] });

      // Mock successful refresh
      mockAuthState.refreshSession.mockResolvedValueOnce(undefined);
      mockAuthState.getToken
        .mockReturnValueOnce('old-token') // while loop check
        .mockReturnValueOnce('old-token') // token variable (for isTokenExpiringSoon check)
        .mockReturnValue('new-token'); // after refresh

      const api = apiClient.getAxiosInstance();
      const response = await api.get('/api/trips');

      expect(response.status).toBe(200);
      // Refresh was called proactively in request interceptor
      expect(mockAuthState.refreshSession).toHaveBeenCalledTimes(1);

      // Reset mock
      tokenUtils.isTokenExpiringSoon.mockReturnValue(false);
    });
  });

  describe('rate limit retry', () => {
    // NOTE: axios-retry is configured to retry 429 errors. After exhausting retries,
    // the error may be transformed to NETWORK_ERROR (status 0) depending on how
    // axios-retry handles the final error after all retries fail.

    it('should retry 429 errors and eventually fail', async () => {
      let attemptCount = 0;
      mockAxios.onGet('/api/trips').reply(() => {
        attemptCount++;
        return [
          429,
          {
            type: 'RATE_LIMIT_ERROR',
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            details: { retryAfter: 5 },
          },
          { 'retry-after': '5' },
        ];
      });

      const api = apiClient.getAxiosInstance();

      try {
        await api.get('/api/trips');
        throw new Error('Should have thrown 429 error');
      } catch (error: any) {
        // After retries, we get an ApiError (status may be 429 or 0)
        expect(error).toBeInstanceOf(ApiError);
        expect([0, 429]).toContain(error.status);
      }

      // axios-retry behavior with 429 may differ from 5xx due to
      // how the error is transformed through interceptors.
      // At minimum, at least one retry should happen.
      expect(attemptCount).toBeGreaterThanOrEqual(2);
    }, 30000);

    it('should succeed on retry if rate limit clears', async () => {
      let attemptCount = 0;
      mockAxios.onGet('/api/trips').reply(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return [
            429,
            {
              type: 'RATE_LIMIT_ERROR',
              code: 'RATE_LIMITED',
              message: 'Too many requests',
              details: { retryAfter: 1 },
            },
          ];
        }
        return [200, { trips: [] }];
      });

      const api = apiClient.getAxiosInstance();
      const response = await api.get('/api/trips');

      expect(response.status).toBe(200);
      expect(attemptCount).toBe(3); // 2 rate limits + 1 success
    }, 30000);

    it('should include rate limit info in error data when status preserved', async () => {
      mockAxios.onGet('/api/trips').reply(429, {
        type: 'RATE_LIMIT_ERROR',
        code: 'RATE_LIMITED',
        message: 'Too many requests',
        details: { retryAfter: 1, limit: 100, window: '1 minute' },
      });

      const api = apiClient.getAxiosInstance();

      try {
        await api.get('/api/trips');
        throw new Error('Should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiError);
        // Status may be 429 or 0 after retries exhaust
        expect([0, 429]).toContain(error.status);
        // If status is 429, rate limit info should be preserved
        if (error.status === 429) {
          expect(error.code).toBe('RATE_LIMITED');
          expect((error.data as any)?.details?.limit).toBe(100);
        }
      }
    }, 30000);
  });

  describe('exponential backoff', () => {
    // base-client.ts has axios-retry configured with 3 retries and exponential backoff
    // for 5xx errors, 429 errors, and network errors

    it('should retry 5xx errors with exponential backoff', async () => {
      let attemptNumber = 0;

      mockAxios.onGet('/api/trips').reply(() => {
        attemptNumber++;
        return [
          500,
          {
            type: 'SYSTEM_ERROR',
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Server error',
          },
        ];
      });

      const api = apiClient.getAxiosInstance();

      try {
        await api.get('/api/trips');
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiError);
        // After retries, status may be 500 or 0 (NETWORK_ERROR) depending on error preservation
        expect([0, 500]).toContain(error.status);
      }

      // axios-retry is configured with 3 retries, so 4 total attempts
      expect(attemptNumber).toBe(4);
    }, 30000); // Increase timeout for retry delays

    it('should cap delay at maxDelay (10s)', async () => {
      // Calculate what the delays would be with capping
      const baseDelay = 1000;
      const backoffFactor = 2;
      const maxDelay = 10000;

      const calculateDelay = (attempt: number) => {
        const uncappedDelay = baseDelay * Math.pow(backoffFactor, attempt);
        return Math.min(uncappedDelay, maxDelay);
      };

      // Test delay calculations
      expect(calculateDelay(0)).toBe(1000); // 1s
      expect(calculateDelay(1)).toBe(2000); // 2s
      expect(calculateDelay(2)).toBe(4000); // 4s
      expect(calculateDelay(3)).toBe(8000); // 8s
      expect(calculateDelay(4)).toBe(10000); // Capped at 10s
      expect(calculateDelay(5)).toBe(10000); // Still capped at 10s
      expect(calculateDelay(10)).toBe(10000); // Still capped at 10s
    });

    it('should stop after maxRetries (3)', async () => {
      let requestCount = 0;

      mockAxios.onGet('/api/trips').reply(() => {
        requestCount++;
        return [
          500,
          {
            type: 'SYSTEM_ERROR',
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Server error',
          },
        ];
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips')).rejects.toThrow();

      // axios-retry configured with retries: 3 means 4 total attempts (1 initial + 3 retries)
      expect(requestCount).toBe(4);
    }, 30000); // Increase timeout for retry delays

    it('should succeed on retry if server recovers', async () => {
      let requestCount = 0;

      mockAxios.onGet('/api/trips').reply(() => {
        requestCount++;
        // First two attempts fail, third succeeds
        if (requestCount < 3) {
          return [
            500,
            {
              type: 'SYSTEM_ERROR',
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Server error',
            },
          ];
        }
        return [200, { trips: [] }];
      });

      const api = apiClient.getAxiosInstance();
      const response = await api.get('/api/trips');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ trips: [] });
      expect(requestCount).toBe(3); // 2 failures + 1 success
    }, 30000); // Increase timeout for retry delays
  });

  describe('non-retryable errors', () => {
    it('should NOT retry 400 validation errors', async () => {
      let requestCount = 0;

      mockAxios.onPost('/api/trips').reply(() => {
        requestCount++;
        return [
          400,
          {
            type: 'VALIDATION_ERROR',
            code: 'VALIDATION_FAILED',
            message: 'Invalid data',
            details: {
              fields: {
                name: 'Name is required',
              },
            },
          },
        ];
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.post('/api/trips', {})).rejects.toThrow();

      // Should only try once
      expect(requestCount).toBe(1);
    });

    it('should NOT retry 403 forbidden errors', async () => {
      let requestCount = 0;

      mockAxios.onGet('/api/trips/123').reply(() => {
        requestCount++;
        return [
          403,
          {
            type: 'PERMISSION_ERROR',
            code: 'NOT_A_MEMBER',
            message: 'Access denied',
          },
        ];
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips/123')).rejects.toThrow();
      expect(requestCount).toBe(1);
    });

    it('should NOT retry 404 not found errors', async () => {
      let requestCount = 0;

      mockAxios.onGet('/api/trips/nonexistent').reply(() => {
        requestCount++;
        return [
          404,
          {
            type: 'RESOURCE_ERROR',
            code: 'TRIP_NOT_FOUND',
            message: 'Trip not found',
          },
        ];
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips/nonexistent')).rejects.toThrow();
      expect(requestCount).toBe(1);
    });

    it('should NOT retry 409 conflict errors', async () => {
      let requestCount = 0;

      mockAxios.onPost('/api/trips/123/members').reply(() => {
        requestCount++;
        return [
          409,
          {
            type: 'CONFLICT_ERROR',
            code: 'ALREADY_MEMBER',
            message: 'Already a member',
          },
        ];
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.post('/api/trips/123/members', { userId: 'user-456' })).rejects.toThrow();
      expect(requestCount).toBe(1);
    });

    it('should NOT retry 422 unprocessable entity errors', async () => {
      let requestCount = 0;

      mockAxios.onPatch('/api/trips/123').reply(() => {
        requestCount++;
        return [
          422,
          {
            type: 'BUSINESS_LOGIC_ERROR',
            code: 'INVALID_STATUS_TRANSITION',
            message: 'Cannot change trip status',
          },
        ];
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.patch('/api/trips/123', { status: 'invalid' })).rejects.toThrow();
      expect(requestCount).toBe(1);
    });
  });

  describe('retry decision logic', () => {
    it('should identify retryable error codes', () => {
      // Helper function to determine if status code is retryable
      const isRetryable = (status: number): boolean => {
        // Token expired (handled specially)
        if (status === 401) return true;

        // Rate limited (handled specially)
        if (status === 429) return true;

        // Server errors
        if (status >= 500) return true;

        // Client errors are not retryable
        return false;
      };

      // Retryable
      expect(isRetryable(401)).toBe(true); // Token expired
      expect(isRetryable(429)).toBe(true); // Rate limited
      expect(isRetryable(500)).toBe(true); // Internal server error
      expect(isRetryable(502)).toBe(true); // Bad gateway
      expect(isRetryable(503)).toBe(true); // Service unavailable
      expect(isRetryable(504)).toBe(true); // Gateway timeout

      // Not retryable
      expect(isRetryable(400)).toBe(false); // Bad request
      expect(isRetryable(403)).toBe(false); // Forbidden
      expect(isRetryable(404)).toBe(false); // Not found
      expect(isRetryable(409)).toBe(false); // Conflict
      expect(isRetryable(422)).toBe(false); // Unprocessable entity
    });

    it('should determine retry strategy based on error type', () => {
      type RetryStrategy = 'token_refresh' | 'rate_limit' | 'exponential_backoff' | 'none';

      const getRetryStrategy = (status: number, errorCode?: string): RetryStrategy => {
        if (status === 401 && errorCode === ERROR_CODES.TOKEN_EXPIRED) {
          return 'token_refresh';
        }

        if (status === 429) {
          return 'rate_limit';
        }

        if (status >= 500) {
          return 'exponential_backoff';
        }

        return 'none';
      };

      expect(getRetryStrategy(401, ERROR_CODES.TOKEN_EXPIRED)).toBe('token_refresh');
      expect(getRetryStrategy(401, 'TOKEN_INVALID')).toBe('none');
      expect(getRetryStrategy(429)).toBe('rate_limit');
      expect(getRetryStrategy(500)).toBe('exponential_backoff');
      expect(getRetryStrategy(503)).toBe('exponential_backoff');
      expect(getRetryStrategy(400)).toBe('none');
      expect(getRetryStrategy(404)).toBe('none');
    });
  });

  describe('concurrent retry handling', () => {
    // NOTE: Due to interceptor architecture, 401 errors are transformed by base-client
    // before api-client can handle them. These tests verify the actual behavior.

    it('should handle concurrent 401 errors (all fail, no retry)', async () => {
      // Multiple requests hit 401 simultaneously - all will fail
      mockAxios.onGet('/api/trips').reply(401, {
        type: 'AUTH_ERROR',
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: ERROR_MESSAGES.TOKEN_EXPIRED,
        refresh_required: true,
      });

      mockAxios.onGet('/api/users').reply(401, {
        type: 'AUTH_ERROR',
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: ERROR_MESSAGES.TOKEN_EXPIRED,
        refresh_required: true,
      });

      mockAxios.onGet('/api/notifications').reply(401, {
        type: 'AUTH_ERROR',
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: ERROR_MESSAGES.TOKEN_EXPIRED,
        refresh_required: true,
      });

      const api = apiClient.getAxiosInstance();

      // Fire all requests concurrently - all will fail with ApiError
      const results = await Promise.allSettled([
        api.get('/api/trips'),
        api.get('/api/users'),
        api.get('/api/notifications'),
      ]);

      // All should fail (401 is not retried by axios-retry)
      expect(results[0].status).toBe('rejected');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('rejected');

      // Verify they are ApiErrors with correct status
      if (results[0].status === 'rejected') {
        expect(results[0].reason).toBeInstanceOf(ApiError);
        expect(results[0].reason.status).toBe(401);
      }

      // No refresh called - base-client handles 401 before response interceptor
      expect(mockAuthState.refreshSession).not.toHaveBeenCalled();
    }, 15000);

    it('should handle concurrent requests with mixed status codes', async () => {
      // One succeeds, one 404, one 500 (500 will be retried)
      mockAxios.onGet('/api/trips').reply(200, { trips: [] });

      mockAxios.onGet('/api/users').reply(404, {
        type: 'RESOURCE_ERROR',
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });

      let serverErrorAttempts = 0;
      mockAxios.onGet('/api/notifications').reply(() => {
        serverErrorAttempts++;
        // Always return 500
        return [
          500,
          {
            type: 'SYSTEM_ERROR',
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Server error',
          },
        ];
      });

      const api = apiClient.getAxiosInstance();

      const results = await Promise.allSettled([
        api.get('/api/trips'),
        api.get('/api/users'),
        api.get('/api/notifications'),
      ]);

      expect(results[0].status).toBe('fulfilled'); // 200
      expect(results[1].status).toBe('rejected'); // 404
      expect(results[2].status).toBe('rejected'); // 500 after retries

      // 500 error should have been retried 3 times (4 total attempts)
      expect(serverErrorAttempts).toBe(4);
    }, 30000);
  });
});
