import { AxiosResponse } from 'axios';

/**
 * API Test Helpers
 *
 * Utilities for mocking API responses in tests.
 * Use these to simulate successful and failed API calls.
 */

/**
 * Creates a mock successful API response.
 *
 * @param data - The response data
 * @param status - HTTP status code (default: 200)
 * @returns A promise resolving to the response
 *
 * @example
 * import { api } from '@/src/api/api-client';
 *
 * jest.spyOn(api, 'get').mockImplementation(() =>
 *   mockApiSuccess({ trips: [trip1, trip2] })
 * );
 */
export const mockApiSuccess = <T>(data: T, status: number = 200): Promise<{ data: T; status: number }> =>
  Promise.resolve({ data, status });

/**
 * Creates a mock API error response.
 *
 * @param status - HTTP status code
 * @param error - Error response data
 * @returns A promise rejecting with the error
 *
 * @example
 * import { api } from '@/src/api/api-client';
 * import { AUTH_ERROR } from '@/__tests__/mocks/api-responses';
 *
 * jest.spyOn(api, 'post').mockImplementation(() =>
 *   mockApiError(401, AUTH_ERROR('INVALID_CREDENTIALS', 'Invalid email or password'))
 * );
 */
export const mockApiError = (status: number, error: any): Promise<never> =>
  Promise.reject({
    response: {
      status,
      data: error
    }
  });

/**
 * Creates a mock network error (no response from server).
 *
 * @param message - Error message (default: 'Network Error')
 * @returns A promise rejecting with a network error
 *
 * @example
 * jest.spyOn(api, 'get').mockImplementation(() => mockNetworkError());
 */
export const mockNetworkError = (message: string = 'Network Error'): Promise<never> =>
  Promise.reject({
    message,
    isAxiosError: true,
    code: 'ERR_NETWORK'
  });

/**
 * Creates a mock axios instance for testing.
 * All HTTP methods are mocked as jest functions.
 *
 * @returns A mock axios instance
 *
 * @example
 * const mockAxios = createMockAxios();
 * mockAxios.get.mockResolvedValue({ data: { trips: [] } });
 */
export const createMockAxios = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  request: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
      clear: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
      clear: jest.fn(),
    },
  },
  defaults: {
    headers: {
      common: {},
      delete: {},
      get: {},
      head: {},
      post: {},
      put: {},
      patch: {},
    },
  },
});

/**
 * Creates a typed Axios response object.
 * Useful when you need a complete response object with headers, etc.
 *
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @param statusText - HTTP status text (default: 'OK')
 * @returns A complete Axios response object
 *
 * @example
 * const response = createMockAxiosResponse({ user: mockUser });
 * expect(response.status).toBe(200);
 * expect(response.data.user).toEqual(mockUser);
 */
export const createMockAxiosResponse = <T = any>(
  data: T,
  status: number = 200,
  statusText: string = 'OK'
): AxiosResponse<T> => ({
  data,
  status,
  statusText,
  headers: {},
  config: {
    headers: {} as any,
  },
});

/**
 * Delays a promise resolution by a specified time.
 * Useful for testing loading states.
 *
 * @param ms - Delay in milliseconds
 * @param value - Value to resolve with
 * @returns A promise that resolves after the delay
 *
 * @example
 * jest.spyOn(api, 'get').mockImplementation(() =>
 *   delay(1000, { data: trips })
 * );
 */
export const delay = <T>(ms: number, value: T): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(value), ms));

/**
 * Creates a mock implementation that succeeds after a number of failures.
 * Useful for testing retry logic.
 *
 * @param failures - Number of times to fail before succeeding
 * @param errorResponse - Error to return for failures
 * @param successResponse - Response to return on success
 * @returns A mock function
 *
 * @example
 * const mockFn = createRetryMock(
 *   2,
 *   mockApiError(500, COMMON_SERVER_ERRORS.INTERNAL_ERROR),
 *   mockApiSuccess({ data: 'success' })
 * );
 *
 * jest.spyOn(api, 'post').mockImplementation(mockFn);
 */
export const createRetryMock = <T>(
  failures: number,
  errorResponse: any,
  successResponse: T
) => {
  let callCount = 0;

  return jest.fn(() => {
    callCount++;
    if (callCount <= failures) {
      return Promise.reject(errorResponse);
    }
    return Promise.resolve(successResponse);
  });
};

/**
 * Asserts that an API call was made with specific parameters.
 *
 * @param mockFn - The mocked API function
 * @param url - Expected URL
 * @param data - Expected request data (optional)
 *
 * @example
 * assertApiCall(api.post, '/api/trips', { name: 'Trip' });
 */
export const assertApiCall = (
  mockFn: jest.Mock,
  url: string,
  data?: any
) => {
  expect(mockFn).toHaveBeenCalled();
  const calls = mockFn.mock.calls;
  const matchingCall = calls.find(call => call[0] === url);

  expect(matchingCall).toBeDefined();

  if (data !== undefined && matchingCall) {
    expect(matchingCall[1]).toEqual(data);
  }
};

/**
 * Clears all mocks created with createMockAxios.
 * Call this in afterEach to reset mock state.
 *
 * @param mockAxios - The mock axios instance to clear
 *
 * @example
 * const mockAxios = createMockAxios();
 *
 * afterEach(() => {
 *   clearMockAxios(mockAxios);
 * });
 */
export const clearMockAxios = (mockAxios: ReturnType<typeof createMockAxios>) => {
  Object.values(mockAxios).forEach(method => {
    if (typeof method === 'function' && 'mockClear' in method) {
      (method as jest.Mock).mockClear();
    }
  });
};
