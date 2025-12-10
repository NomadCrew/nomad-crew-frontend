# API Error Handling and Retry Strategy Tests

This directory contains comprehensive tests for the frontend API client's error handling and retry mechanisms.

## Test Files

### 1. `error-handling.test.ts`
Tests the API client's handling of various HTTP error responses from the backend.

**Test Coverage:**
- **Authentication Errors (401)**
  - TOKEN_EXPIRED: Auto-refresh and retry
  - TOKEN_INVALID: Clear credentials
  - TOKEN_MISSING: Redirect to login
  - Concurrent request handling during token refresh

- **Validation Errors (400)**
  - Field-level validation errors
  - General validation messages

- **Authorization Errors (403)**
  - FORBIDDEN access denied
  - No retry on 403 errors

- **Resource Errors (404)**
  - NOT_FOUND handling
  - No retry on 404 errors

- **Conflict Errors (409)**
  - ALREADY_MEMBER conflicts
  - No retry on conflict errors

- **Rate Limiting (429)**
  - Retry-After header extraction
  - Rate limit headers (X-RateLimit-*)

- **Server Errors (5xx)**
  - INTERNAL_SERVER_ERROR (500)
  - SERVICE_UNAVAILABLE (503)
  - BAD_GATEWAY (502)
  - GATEWAY_TIMEOUT (504)

- **Network Errors**
  - Timeout handling
  - No response errors
  - Connection refused

### 2. `retry-strategy.test.ts`
Tests the retry logic and backoff strategies.

**Test Coverage:**
- **Token Refresh Retry**
  - Refresh on TOKEN_EXPIRED
  - Single retry attempt
  - Logout on refresh failure

- **Rate Limit Retry**
  - Respect Retry-After duration
  - Handle missing Retry-After

- **Exponential Backoff** (Documented behavior)
  - 5xx errors: 1s, 2s, 4s delays
  - Maximum delay cap (10s)
  - Maximum retry limit (3)

- **Non-Retryable Errors**
  - 400 validation errors
  - 403 forbidden errors
  - 404 not found errors
  - 409 conflict errors

- **Concurrent Retry Handling**
  - Queue concurrent requests during token refresh
  - Handle mixed success/failure

## Setup

The tests use a custom setup file (`setup.ts`) that mocks:
- localStorage (for Supabase)
- AsyncStorage
- expo-secure-store
- Supabase client
- Logger utilities
- Token utilities

## Running the Tests

```bash
# Run all API tests
npm test -- __tests__/api

# Run specific test file
npm test -- __tests__/api/error-handling.test.ts
npm test -- __tests__/api/retry-strategy.test.ts

# Run with coverage
npm test -- __tests__/api --coverage

# Run in watch mode
npm test -- __tests__/api --watch
```

## Test Results Summary

**Error Handling Tests:**
- ✓ 15 passing tests
- ✗ 10 tests with implementation gaps (documented below)

**Retry Strategy Tests:**
- Tests demonstrate expected behavior for retry mechanisms
- Current implementation handles token refresh
- Rate limiting and exponential backoff are documented patterns

## Implementation Gaps Identified

The tests have revealed several areas where the current implementation differs from the expected behavior:

### 1. Response Interception
The `base-client.ts` error interceptor transforms error responses, which loses the original error data. Tests expect access to `error.response.data` and `error.response.headers`.

**Fix needed:** Preserve error response data while still handling errors appropriately.

### 2. Rate Limiting
Current implementation doesn't automatically retry 429 responses or respect Retry-After headers.

**Enhancement opportunity:** Implement automatic retry with Retry-After support.

### 3. Exponential Backoff
Current implementation doesn't automatically retry 5xx errors with exponential backoff.

**Enhancement opportunity:** Implement retry logic for transient server errors.

### 4. Error Response Structure
Tests assume backend errors follow this structure:
```json
{
  "type": "ERROR_TYPE",
  "message": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": "Additional context"
}
```

The interceptor should preserve this structure for frontend consumption.

## Test Utilities

### MockAdapter (axios-mock-adapter)
Used to mock HTTP responses without making actual network requests.

```typescript
mockAxios.onGet('/api/trips').reply(200, { trips: [] });
mockAxios.onPost('/api/trips').reply(401, errorResponse);
```

### Auth State Mocking
Tests mock the auth state handlers to control token refresh behavior:

```typescript
mockAuthState.refreshSession.mockResolvedValue(undefined);
mockAuthState.getToken.mockReturnValue('new-token');
```

### Fake Timers
Retry strategy tests use Jest fake timers to test time-based delays:

```typescript
jest.useFakeTimers();
// ... test code
jest.useRealTimers();
```

## Error Response Format

All tests follow the backend API error response format documented in:
`docs/03-reference/backend/api/error-responses.md`

### Standard Error Structure
```typescript
interface ApiError {
  type: string;         // ERROR_TYPE
  message: string;      // Human-readable message
  code: string;         // MACHINE_READABLE_CODE
  details?: any;        // Additional context
}
```

### Error Types
- `AUTH_ERROR`: Authentication failures
- `VALIDATION_ERROR`: Invalid request data
- `PERMISSION_ERROR`: Access denied
- `RESOURCE_ERROR`: Not found
- `CONFLICT_ERROR`: State conflicts
- `RATE_LIMIT_ERROR`: Too many requests
- `SYSTEM_ERROR`: Server errors
- `EXTERNAL_ERROR`: Third-party failures

## Next Steps

1. **Fix Response Preservation**: Update `base-client.ts` to preserve error response data
2. **Implement Rate Limit Retry**: Add automatic retry with Retry-After support
3. **Add Exponential Backoff**: Implement retry logic for 5xx errors
4. **Add Integration Tests**: Test real API interactions in staging environment
5. **Document Retry Behavior**: Update frontend docs with retry strategies

## Related Documentation

- Backend API Error Responses: `docs/03-reference/backend/api/error-responses.md`
- Frontend API Client: `src/api/api-client.ts`
- Base Client: `src/api/base-client.ts`
- Error Constants: `src/api/constants.ts`

## Maintenance

When adding new error types or changing error handling behavior:

1. Update tests in this directory
2. Update `setup.ts` if new mocks are needed
3. Update backend error documentation
4. Ensure error codes match between frontend and backend
5. Test error scenarios in staging before production

---

**Last Updated:** 2025-11-28
**Test Status:** Active
**Coverage Target:** 90%+ for error handling paths
