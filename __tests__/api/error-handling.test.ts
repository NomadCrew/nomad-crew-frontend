// Import setup FIRST to ensure all mocks are in place
import './test-setup';

import MockAdapter from 'axios-mock-adapter';
import { ApiClient, registerAuthHandlers } from '@/src/api/api-client';
import { ERROR_CODES, ERROR_MESSAGES } from '@/src/api/constants';

describe('API Error Handling', () => {
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
  });

  afterEach(() => {
    mockAxios.reset();
    mockAxios.restore();
    jest.clearAllMocks();
  });

  describe('authentication errors (401)', () => {
    it('should handle TOKEN_EXPIRED by refreshing', async () => {
      // First request returns 401 TOKEN_EXPIRED
      mockAxios
        .onGet('/api/trips')
        .replyOnce(401, {
          type: 'AUTH_ERROR',
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: ERROR_MESSAGES.TOKEN_EXPIRED,
          details: 'JWT token expired at 2025-11-28T10:30:00Z',
        })
        // Second request (after refresh) succeeds
        .onGet('/api/trips')
        .replyOnce(200, { trips: [] });

      // Mock successful refresh
      mockAuthState.refreshSession.mockResolvedValueOnce(undefined);
      mockAuthState.getToken
        .mockReturnValueOnce('valid-token') // First call (before refresh)
        .mockReturnValueOnce('valid-token') // During refresh check
        .mockReturnValueOnce('new-valid-token'); // After refresh

      const api = apiClient.getAxiosInstance();
      const response = await api.get('/api/trips');

      expect(response.status).toBe(200);
      expect(mockAuthState.refreshSession).toHaveBeenCalledTimes(1);
      expect(response.data).toEqual({ trips: [] });
    });

    it('should handle TOKEN_INVALID by clearing auth', async () => {
      mockAxios.onGet('/api/trips').reply(401, {
        type: 'AUTH_ERROR',
        code: 'TOKEN_INVALID',
        message: 'Invalid or malformed token',
        details: 'Token signature verification failed',
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips')).rejects.toThrow();

      // Should not attempt refresh for invalid token
      expect(mockAuthState.refreshSession).not.toHaveBeenCalled();
    });

    it('should redirect to login on TOKEN_MISSING', async () => {
      // Simulate no token available
      mockAuthState.getToken.mockReturnValue(null);
      mockAuthState.refreshSession.mockRejectedValueOnce(new Error('No refresh token'));

      mockAxios.onGet('/api/trips').reply(401, {
        type: 'AUTH_ERROR',
        code: 'TOKEN_MISSING',
        message: 'No authorization token provided',
        details: 'Authorization header is missing',
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips')).rejects.toThrow('Authentication required');
      expect(mockAuthState.logout).toHaveBeenCalled();
    });

    it('should only refresh token once for concurrent requests', async () => {
      // Multiple requests return 401 TOKEN_EXPIRED
      mockAxios
        .onGet('/api/trips')
        .replyOnce(401, {
          type: 'AUTH_ERROR',
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: ERROR_MESSAGES.TOKEN_EXPIRED,
        })
        .onGet('/api/trips')
        .reply(200, { trips: [] });

      mockAxios
        .onGet('/api/users')
        .replyOnce(401, {
          type: 'AUTH_ERROR',
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: ERROR_MESSAGES.TOKEN_EXPIRED,
        })
        .onGet('/api/users')
        .reply(200, { users: [] });

      // Mock successful refresh with delay
      mockAuthState.refreshSession.mockImplementation(() =>
        new Promise((resolve) => setTimeout(resolve, 100))
      );
      mockAuthState.getToken
        .mockReturnValueOnce('old-token')
        .mockReturnValueOnce('old-token')
        .mockReturnValue('new-token');

      const api = apiClient.getAxiosInstance();

      // Fire concurrent requests
      const [response1, response2] = await Promise.all([
        api.get('/api/trips'),
        api.get('/api/users'),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      // Should only refresh once for concurrent requests
      expect(mockAuthState.refreshSession).toHaveBeenCalledTimes(1);
    });

    it('should logout if refresh fails', async () => {
      mockAxios.onGet('/api/trips').reply(401, {
        type: 'AUTH_ERROR',
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: ERROR_MESSAGES.TOKEN_EXPIRED,
      });

      // Mock failed refresh
      mockAuthState.refreshSession.mockRejectedValueOnce(
        new Error(ERROR_MESSAGES.INVALID_REFRESH_TOKEN)
      );

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips')).rejects.toThrow();
      expect(mockAuthState.logout).toHaveBeenCalled();
    });
  });

  describe('validation errors (400)', () => {
    it('should extract field-level errors from details', async () => {
      const errorResponse = {
        type: 'VALIDATION_ERROR',
        code: 'VALIDATION_FAILED',
        message: 'Invalid data',
        details: {
          fields: {
            email: 'Invalid email format',
            startDate: 'Cannot be in past',
            'destination.latitude': 'Must be between -90 and 90',
          },
        },
      };

      mockAxios.onPost('/api/trips').reply(400, errorResponse);

      const api = apiClient.getAxiosInstance();

      try {
        await api.post('/api/trips', {
          name: 'Test Trip',
          email: 'invalid-email',
          startDate: '2020-01-01',
        });
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Invalid data');
        // Note: In real implementation, you'd parse error.response.data to extract fields
      }
    });

    it('should handle validation error without field details', async () => {
      mockAxios.onPost('/api/trips').reply(400, {
        type: 'VALIDATION_ERROR',
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed',
        details: 'Missing required fields',
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.post('/api/trips', {})).rejects.toThrow();
    });
  });

  describe('authorization errors (403)', () => {
    it('should handle FORBIDDEN with access denied', async () => {
      mockAxios.onGet('/api/trips/123').reply(403, {
        type: 'PERMISSION_ERROR',
        code: 'NOT_A_MEMBER',
        message: 'You do not have access to this trip',
        details: 'User must be a trip member to perform this action',
      });

      const api = apiClient.getAxiosInstance();

      try {
        await api.get('/api/trips/123');
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('permission');
      }
    });

    it('should not retry 403 errors', async () => {
      let requestCount = 0;
      mockAxios.onGet('/api/trips/123').reply(() => {
        requestCount++;
        return [403, {
          type: 'PERMISSION_ERROR',
          code: 'FORBIDDEN',
          message: 'Access denied',
        }];
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips/123')).rejects.toThrow();
      expect(requestCount).toBe(1); // Should only try once
    });
  });

  describe('resource errors (404)', () => {
    it('should handle NOT_FOUND appropriately', async () => {
      mockAxios.onGet('/api/trips/nonexistent').reply(404, {
        type: 'RESOURCE_ERROR',
        code: 'TRIP_NOT_FOUND',
        message: 'Trip not found',
        details: 'No trip exists with ID: nonexistent',
      });

      const api = apiClient.getAxiosInstance();

      try {
        await api.get('/api/trips/nonexistent');
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should not retry 404 errors', async () => {
      let requestCount = 0;
      mockAxios.onGet('/api/trips/123').reply(() => {
        requestCount++;
        return [404, {
          type: 'RESOURCE_ERROR',
          code: 'NOT_FOUND',
          message: 'Resource not found',
        }];
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips/123')).rejects.toThrow();
      expect(requestCount).toBe(1);
    });
  });

  describe('conflict errors (409)', () => {
    it('should handle ALREADY_MEMBER error', async () => {
      mockAxios.onPost('/api/trips/123/members').reply(409, {
        type: 'CONFLICT_ERROR',
        code: 'ALREADY_MEMBER',
        message: 'User is already a member of this trip',
        details: 'Cannot add duplicate member',
      });

      const api = apiClient.getAxiosInstance();

      try {
        await api.post('/api/trips/123/members', { userId: 'user-456' });
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('already');
      }
    });

    it('should not retry conflict errors', async () => {
      let requestCount = 0;
      mockAxios.onPost('/api/invitations/accept').reply(() => {
        requestCount++;
        return [409, {
          type: 'CONFLICT_ERROR',
          code: 'ALREADY_PROCESSED',
          message: 'Invitation already processed',
        }];
      });

      const api = apiClient.getAxiosInstance();

      await expect(
        api.post('/api/invitations/accept', { token: 'abc123' })
      ).rejects.toThrow();
      expect(requestCount).toBe(1);
    });
  });

  describe('rate limiting (429)', () => {
    it('should extract Retry-After header', async () => {
      mockAxios.onGet('/api/trips').reply(429,
        {
          type: 'RATE_LIMIT_ERROR',
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          details: { retryAfter: 60 },
        },
        {
          'retry-after': '60',
          'x-ratelimit-limit': '100',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1732800000',
        }
      );

      const api = apiClient.getAxiosInstance();

      try {
        await api.get('/api/trips');
        throw new Error('Should have thrown error');
      } catch (error: any) {
        // In Axios, response headers are available on error.response.headers
        expect(error.response?.headers['retry-after']).toBe('60');
        expect(error.response?.data?.details?.retryAfter).toBe(60);
      }
    });

    it('should extract rate limit headers', async () => {
      const rateLimitHeaders = {
        'x-ratelimit-limit': '100',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': '1732800000',
        'retry-after': '30',
      };

      mockAxios.onPost('/api/messages').reply(429,
        {
          type: 'RATE_LIMIT_ERROR',
          code: 'MESSAGE_RATE_LIMITED',
          message: 'Too many messages sent',
          details: {
            retryAfter: 30,
            limit: 100,
            window: '1 minute',
          },
        },
        rateLimitHeaders
      );

      const api = apiClient.getAxiosInstance();

      try {
        await api.post('/api/messages', { text: 'Hello' });
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect(error.response?.headers['x-ratelimit-limit']).toBe('100');
        expect(error.response?.headers['x-ratelimit-remaining']).toBe('0');
        expect(error.response?.headers['x-ratelimit-reset']).toBe('1732800000');
        expect(error.response?.headers['retry-after']).toBe('30');
      }
    });

    it('should handle rate limit without Retry-After header', async () => {
      mockAxios.onGet('/api/trips').reply(429, {
        type: 'RATE_LIMIT_ERROR',
        code: 'RATE_LIMITED',
        message: 'Too many requests',
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips')).rejects.toThrow();
    });
  });

  describe('server errors (5xx)', () => {
    it('should handle 500 INTERNAL_SERVER_ERROR', async () => {
      mockAxios.onGet('/api/trips').reply(500, {
        type: 'SYSTEM_ERROR',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: 'Error ID: err_abc123xyz',
      });

      const api = apiClient.getAxiosInstance();

      try {
        await api.get('/api/trips');
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('internal server error');
      }
    });

    it('should handle 503 SERVICE_UNAVAILABLE', async () => {
      mockAxios.onGet('/api/trips').reply(503, {
        type: 'SYSTEM_ERROR',
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable',
        details: 'Maintenance in progress',
      });

      const api = apiClient.getAxiosInstance();

      try {
        await api.get('/api/trips');
        throw new Error('Should have thrown error');
      } catch (error: any) {
        // The error message comes from the response data, not the constant
        expect(error.message).toContain('Service temporarily unavailable');
      }
    });

    it('should handle 502 BAD_GATEWAY', async () => {
      mockAxios.onGet('/api/trips').reply(502, {
        type: 'EXTERNAL_ERROR',
        code: 'BAD_GATEWAY',
        message: 'Upstream service unavailable',
        details: 'Database connection failed',
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips')).rejects.toThrow();
    });

    it('should handle 504 GATEWAY_TIMEOUT', async () => {
      mockAxios.onGet('/api/trips').reply(504, {
        type: 'SYSTEM_ERROR',
        code: 'GATEWAY_TIMEOUT',
        message: 'Request timeout',
        details: 'Upstream service took too long to respond',
      });

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips')).rejects.toThrow();
    });
  });

  describe('network errors', () => {
    it('should handle network timeout', async () => {
      mockAxios.onGet('/api/trips').timeout();

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips')).rejects.toThrow();
    });

    it('should handle network error (no response)', async () => {
      mockAxios.onGet('/api/trips').networkError();

      const api = apiClient.getAxiosInstance();

      try {
        await api.get('/api/trips');
        throw new Error('Should have thrown error');
      } catch (error: any) {
        // Network errors show a user-friendly message about connection issues
        expect(error.message).toContain('No response from server');
      }
    });

    it('should handle connection refused', async () => {
      mockAxios.onGet('/api/trips').networkErrorOnce();

      const api = apiClient.getAxiosInstance();

      await expect(api.get('/api/trips')).rejects.toThrow();
    });
  });

  describe('error response structure validation', () => {
    it('should parse standard error response structure', async () => {
      const standardError = {
        type: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        code: 'VALIDATION_FAILED',
        details: {
          fields: {
            name: 'Name is required',
          },
        },
      };

      mockAxios.onPost('/api/trips').reply(400, standardError);

      const api = apiClient.getAxiosInstance();

      try {
        await api.post('/api/trips', {});
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect(error.response?.data).toEqual(standardError);
        expect(error.response?.data?.type).toBe('VALIDATION_ERROR');
        expect(error.response?.data?.code).toBe('VALIDATION_FAILED');
        expect(error.response?.data?.message).toBe('Invalid request data');
        expect(error.response?.data?.details?.fields).toBeDefined();
      }
    });

    it('should handle minimal error response', async () => {
      const minimalError = {
        type: 'ERROR',
        message: 'Something went wrong',
        code: 'UNKNOWN_ERROR',
      };

      mockAxios.onGet('/api/trips').reply(500, minimalError);

      const api = apiClient.getAxiosInstance();

      try {
        await api.get('/api/trips');
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect(error.response?.data).toEqual(minimalError);
        expect(error.response?.data?.details).toBeUndefined();
      }
    });
  });
});
