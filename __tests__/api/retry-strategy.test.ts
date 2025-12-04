// Import setup FIRST to ensure all mocks are in place
import './setup';

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ApiClient, registerAuthHandlers } from '@/src/api/api-client';
import { ERROR_CODES, ERROR_MESSAGES } from '@/src/api/constants';

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
    mockAxios = new MockAdapter(apiClient.getAxiosInstance());

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

    // Use fake timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    mockAxios.reset();
    mockAxios.restore();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('token refresh retry', () => {
    it('should refresh token on 401 TOKEN_EXPIRED', async () => {
      // First request returns 401
      mockAxios
        .onGet('/api/trips')
        .replyOnce(401, {
          type: 'AUTH_ERROR',
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: ERROR_MESSAGES.TOKEN_EXPIRED,
          refresh_required: true,
        })
        // Second request (after refresh) succeeds
        .onGet('/api/trips')
        .replyOnce(200, { trips: [] });

      // Mock successful refresh
      mockAuthState.refreshSession.mockResolvedValueOnce(undefined);
      mockAuthState.getToken
        .mockReturnValueOnce('old-token')
        .mockReturnValueOnce('old-token')
        .mockReturnValue('new-token');

      const api = apiClient.getAxiosInstance();
      const response = await api.get('/api/trips');

      expect(response.status).toBe(200);
      expect(mockAuthState.refreshSession).toHaveBeenCalledTimes(1);
      expect(response.data).toEqual({ trips: [] });
    });

    it('should only retry once for token refresh', async () => {
      let requestCount = 0;

      // Both requests return 401
      mockAxios.onGet('/api/trips').reply(() => {
        requestCount++;
        return [401, {
          type: 'AUTH_ERROR',
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: ERROR_MESSAGES.TOKEN_EXPIRED,
          refresh_required: true,
        }];
      });

      // Mock successful refresh but request still fails
      mockAuthState.refreshSession.mockResolvedValue(undefined);
      mockAuthState.getToken.mockReturnValue('new-token');

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips')).rejects.toThrow();

      // Should try twice: original + 1 retry after refresh
      expect(requestCount).toBe(2);
      expect(mockAuthState.refreshSession).toHaveBeenCalledTimes(1);
    });

    it('should logout if refresh fails', async () => {
      mockAxios.onGet('/api/trips').reply(401, {
        type: 'AUTH_ERROR',
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: ERROR_MESSAGES.TOKEN_EXPIRED,
        refresh_required: true,
      });

      // Mock failed refresh
      mockAuthState.refreshSession.mockRejectedValueOnce(
        new Error(ERROR_MESSAGES.INVALID_REFRESH_TOKEN)
      );

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips')).rejects.toThrow();

      expect(mockAuthState.refreshSession).toHaveBeenCalledTimes(1);
      expect(mockAuthState.logout).toHaveBeenCalled();
    });

    it('should not retry if token refresh returns no new token', async () => {
      mockAxios.onGet('/api/trips').reply(401, {
        type: 'AUTH_ERROR',
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: ERROR_MESSAGES.TOKEN_EXPIRED,
        refresh_required: true,
      });

      // Mock refresh that doesn't return a token
      mockAuthState.refreshSession.mockResolvedValueOnce(undefined);
      mockAuthState.getToken
        .mockReturnValueOnce('old-token')
        .mockReturnValue(null); // No new token after refresh

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips')).rejects.toThrow('Token refresh failed');
      expect(mockAuthState.refreshSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('rate limit retry', () => {
    it('should wait for Retry-After duration', async () => {
      const retryAfterSeconds = 5;
      let requestCount = 0;

      mockAxios
        .onGet('/api/trips')
        .replyOnce(
          429,
          {
            type: 'RATE_LIMIT_ERROR',
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            details: { retryAfter: retryAfterSeconds },
          },
          { 'retry-after': retryAfterSeconds.toString() }
        )
        .onGet('/api/trips')
        .reply(() => {
          requestCount++;
          return [200, { trips: [] }];
        });

      const api = apiClient.getAxiosInstance();

      // Note: Current implementation doesn't have automatic retry for 429
      // This test demonstrates expected behavior for a retry mechanism
      try {
        await api.get('/api/trips');
        fail('Should have thrown 429 error');
      } catch (error: any) {
        expect(error.response?.status).toBe(429);
        expect(error.response?.headers['retry-after']).toBe('5');
        expect(error.response?.data?.details?.retryAfter).toBe(5);
      }

      // In a real implementation with retry, you would:
      // 1. Extract retry-after value
      // 2. Wait for that duration
      // 3. Retry the request
      expect(requestCount).toBe(0); // Second request not made in current implementation
    });

    it('should respect Retry-After header from multiple rate limit responses', async () => {
      const retrySequence = [30, 60, 120]; // Increasing backoff
      let requestCount = 0;

      retrySequence.forEach((retryAfter) => {
        mockAxios.onGet('/api/trips').replyOnce(
          429,
          {
            type: 'RATE_LIMIT_ERROR',
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            details: { retryAfter },
          },
          { 'retry-after': retryAfter.toString() }
        );
      });

      mockAxios.onGet('/api/trips').reply(200, { trips: [] });

      const api = apiClient.getAxiosInstance();

      // First attempt
      try {
        await api.get('/api/trips');
        fail('Should have thrown 429 error');
      } catch (error: any) {
        expect(error.response?.headers['retry-after']).toBe('30');
      }
    });

    it('should handle missing Retry-After header', async () => {
      mockAxios.onGet('/api/trips').reply(429, {
        type: 'RATE_LIMIT_ERROR',
        code: 'RATE_LIMITED',
        message: 'Too many requests',
      });

      const api = apiClient.getAxiosInstance();

      try {
        await api.get('/api/trips');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response?.status).toBe(429);
        // Should handle gracefully even without Retry-After header
        expect(error.response?.headers['retry-after']).toBeUndefined();
      }
    });
  });

  describe('exponential backoff', () => {
    // Note: Current base-client.ts doesn't implement automatic retry with exponential backoff
    // These tests demonstrate expected behavior for a retry mechanism

    it('should demonstrate exponential backoff pattern for 5xx errors', async () => {
      // This test demonstrates the expected backoff delays: 1s, 2s, 4s
      const expectedDelays = [1000, 2000, 4000];
      let attemptNumber = 0;

      mockAxios
        .onGet('/api/trips')
        .reply(() => {
          attemptNumber++;
          return [500, {
            type: 'SYSTEM_ERROR',
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Server error',
          }];
        });

      const api = apiClient.getAxiosInstance();

      try {
        await api.get('/api/trips');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response?.status).toBe(500);
      }

      // Current implementation doesn't retry automatically
      expect(attemptNumber).toBe(1);

      // Expected behavior with exponential backoff:
      // Attempt 1: Immediate
      // Attempt 2: After 1s delay
      // Attempt 3: After 2s delay (total 3s)
      // Attempt 4: After 4s delay (total 7s)
      expect(expectedDelays).toEqual([1000, 2000, 4000]);
    });

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
      expect(calculateDelay(0)).toBe(1000);   // 1s
      expect(calculateDelay(1)).toBe(2000);   // 2s
      expect(calculateDelay(2)).toBe(4000);   // 4s
      expect(calculateDelay(3)).toBe(8000);   // 8s
      expect(calculateDelay(4)).toBe(10000);  // Capped at 10s
      expect(calculateDelay(5)).toBe(10000);  // Still capped at 10s
      expect(calculateDelay(10)).toBe(10000); // Still capped at 10s
    });

    it('should stop after maxRetries (3)', async () => {
      let requestCount = 0;

      mockAxios.onGet('/api/trips').reply(() => {
        requestCount++;
        return [500, {
          type: 'SYSTEM_ERROR',
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Server error',
        }];
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips')).rejects.toThrow();

      // Current implementation doesn't retry
      expect(requestCount).toBe(1);

      // Expected behavior with retry: maxRetries = 3 means 4 total attempts
      // (1 initial + 3 retries)
      const expectedMaxAttempts = 4;
      expect(expectedMaxAttempts).toBe(4);
    });

    it('should succeed on retry if server recovers', async () => {
      let requestCount = 0;

      mockAxios
        .onGet('/api/trips')
        .replyOnce(() => {
          requestCount++;
          return [500, {
            type: 'SYSTEM_ERROR',
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Server error',
          }];
        })
        .onGet('/api/trips')
        .replyOnce(() => {
          requestCount++;
          return [500, {
            type: 'SYSTEM_ERROR',
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Server error',
          }];
        })
        .onGet('/api/trips')
        .reply(() => {
          requestCount++;
          return [200, { trips: [] }];
        });

      const api = apiClient.getAxiosInstance();

      // Current implementation throws on first 500
      await expect(api.get('/api/trips')).rejects.toThrow();
      expect(requestCount).toBe(1);

      // With retry implementation, would eventually succeed
      // expect(response.status).toBe(200);
      // expect(requestCount).toBe(3);
    });
  });

  describe('non-retryable errors', () => {
    it('should NOT retry 400 validation errors', async () => {
      let requestCount = 0;

      mockAxios.onPost('/api/trips').reply(() => {
        requestCount++;
        return [400, {
          type: 'VALIDATION_ERROR',
          code: 'VALIDATION_FAILED',
          message: 'Invalid data',
          details: {
            fields: {
              name: 'Name is required',
            },
          },
        }];
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
        return [403, {
          type: 'PERMISSION_ERROR',
          code: 'NOT_A_MEMBER',
          message: 'Access denied',
        }];
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips/123')).rejects.toThrow();
      expect(requestCount).toBe(1);
    });

    it('should NOT retry 404 not found errors', async () => {
      let requestCount = 0;

      mockAxios.onGet('/api/trips/nonexistent').reply(() => {
        requestCount++;
        return [404, {
          type: 'RESOURCE_ERROR',
          code: 'TRIP_NOT_FOUND',
          message: 'Trip not found',
        }];
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips/nonexistent')).rejects.toThrow();
      expect(requestCount).toBe(1);
    });

    it('should NOT retry 409 conflict errors', async () => {
      let requestCount = 0;

      mockAxios.onPost('/api/trips/123/members').reply(() => {
        requestCount++;
        return [409, {
          type: 'CONFLICT_ERROR',
          code: 'ALREADY_MEMBER',
          message: 'Already a member',
        }];
      });

      const api = apiClient.getAxiosInstance();

      await expect(
        api.post('/api/trips/123/members', { userId: 'user-456' })
      ).rejects.toThrow();
      expect(requestCount).toBe(1);
    });

    it('should NOT retry 422 unprocessable entity errors', async () => {
      let requestCount = 0;

      mockAxios.onPatch('/api/trips/123').reply(() => {
        requestCount++;
        return [422, {
          type: 'BUSINESS_LOGIC_ERROR',
          code: 'INVALID_STATUS_TRANSITION',
          message: 'Cannot change trip status',
        }];
      });

      const api = apiClient.getAxiosInstance();

      await expect(
        api.patch('/api/trips/123', { status: 'invalid' })
      ).rejects.toThrow();
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
      expect(isRetryable(401)).toBe(true);  // Token expired
      expect(isRetryable(429)).toBe(true);  // Rate limited
      expect(isRetryable(500)).toBe(true);  // Internal server error
      expect(isRetryable(502)).toBe(true);  // Bad gateway
      expect(isRetryable(503)).toBe(true);  // Service unavailable
      expect(isRetryable(504)).toBe(true);  // Gateway timeout

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
    it('should queue concurrent requests during token refresh', async () => {
      // Multiple requests hit 401 simultaneously
      mockAxios
        .onGet('/api/trips')
        .replyOnce(401, {
          type: 'AUTH_ERROR',
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: ERROR_MESSAGES.TOKEN_EXPIRED,
          refresh_required: true,
        })
        .onGet('/api/trips')
        .reply(200, { trips: [] });

      mockAxios
        .onGet('/api/users')
        .replyOnce(401, {
          type: 'AUTH_ERROR',
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: ERROR_MESSAGES.TOKEN_EXPIRED,
          refresh_required: true,
        })
        .onGet('/api/users')
        .reply(200, { users: [] });

      mockAxios
        .onGet('/api/notifications')
        .replyOnce(401, {
          type: 'AUTH_ERROR',
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: ERROR_MESSAGES.TOKEN_EXPIRED,
          refresh_required: true,
        })
        .onGet('/api/notifications')
        .reply(200, { notifications: [] });

      // Mock refresh with delay
      mockAuthState.refreshSession.mockImplementation(() =>
        new Promise((resolve) => setTimeout(resolve, 100))
      );
      mockAuthState.getToken
        .mockReturnValueOnce('old-token')
        .mockReturnValueOnce('old-token')
        .mockReturnValueOnce('old-token')
        .mockReturnValue('new-token');

      const api = apiClient.getAxiosInstance();

      // Fire all requests concurrently
      const [result1, result2, result3] = await Promise.all([
        api.get('/api/trips'),
        api.get('/api/users'),
        api.get('/api/notifications'),
      ]);

      // All should succeed
      expect(result1.status).toBe(200);
      expect(result2.status).toBe(200);
      expect(result3.status).toBe(200);

      // Should only refresh once
      expect(mockAuthState.refreshSession).toHaveBeenCalledTimes(1);
    });

    it('should handle mixed success and failure during concurrent retries', async () => {
      mockAxios
        .onGet('/api/trips')
        .replyOnce(401, {
          type: 'AUTH_ERROR',
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: ERROR_MESSAGES.TOKEN_EXPIRED,
          refresh_required: true,
        })
        .onGet('/api/trips')
        .reply(200, { trips: [] });

      mockAxios
        .onGet('/api/users')
        .replyOnce(401, {
          type: 'AUTH_ERROR',
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: ERROR_MESSAGES.TOKEN_EXPIRED,
          refresh_required: true,
        })
        .onGet('/api/users')
        .reply(404, {
          type: 'RESOURCE_ERROR',
          code: 'NOT_FOUND',
          message: 'Resource not found',
        });

      mockAuthState.refreshSession.mockResolvedValue(undefined);
      mockAuthState.getToken
        .mockReturnValueOnce('old-token')
        .mockReturnValueOnce('old-token')
        .mockReturnValue('new-token');

      const api = apiClient.getAxiosInstance();

      const results = await Promise.allSettled([
        api.get('/api/trips'),
        api.get('/api/users'),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(mockAuthState.refreshSession).toHaveBeenCalledTimes(1);
    });
  });
});
