# Test Utilities Quick Reference

## Import Paths

All test utilities can be imported using the `@/__tests__/` alias:

```typescript
// Factories
import { createMockUser, createMockTrip } from '@/__tests__/factories';

// Helpers  
import { resetAllStores, mockApiSuccess } from '@/__tests__/helpers';

// Error Responses
import { VALIDATION_ERROR, COMMON_AUTH_ERRORS } from '@/__tests__/mocks/api-responses';

// Supabase Mocks
import { createMockSession, mockSuccessfulSignIn } from '@/__tests__/mocks/supabase.mock';

// Test Utils (render with providers)
import { render } from '@/__tests__/test-utils';
```

## Most Common Patterns

### 1. Basic Test Setup

```typescript
import { render } from '@/__tests__/test-utils';
import { createMockUser } from '@/__tests__/factories';
import { setupAuthenticatedUser, resetAllStores } from '@/__tests__/helpers';

describe('MyComponent', () => {
  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
  });

  it('renders for authenticated user', () => {
    setupAuthenticatedUser(createMockUser());
    const { getByText } = render(<MyComponent />);
    expect(getByText('Welcome')).toBeDefined();
  });
});
```

### 2. Mock API Calls

```typescript
import { api } from '@/src/api/api-client';
import { mockApiSuccess, mockApiError } from '@/__tests__/helpers';
import { createMockTrip } from '@/__tests__/factories';
import { COMMON_AUTH_ERRORS } from '@/__tests__/mocks/api-responses';

// Success
jest.spyOn(api, 'get').mockImplementation(() =>
  mockApiSuccess([createMockTrip()])
);

// Error
jest.spyOn(api, 'post').mockImplementation(() =>
  mockApiError(401, COMMON_AUTH_ERRORS.INVALID_CREDENTIALS)
);
```

### 3. Mock Supabase Auth

```typescript
import { supabase } from '@/src/auth/supabaseClient';
import {
  createMockSession,
  mockSuccessfulSignIn,
  mockAuthError
} from '@/__tests__/mocks/supabase.mock';

jest.mock('@/src/auth/supabaseClient');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Success
mockSupabase.auth.signInWithPassword.mockResolvedValue(
  mockSuccessfulSignIn(createMockSession())
);

// Error
mockSupabase.auth.signInWithPassword.mockResolvedValue(
  mockAuthError('Invalid credentials')
);
```

### 4. Test Store Operations

```typescript
import { useAuthStore } from '@/src/store/useAuthStore';
import { useTripStore } from '@/src/store/useTripStore';
import { getAuthState, getTripState, waitForTripLoading } from '@/__tests__/helpers';

// Execute store action
await useTripStore.getState().fetchTrips();

// Wait for completion
await waitForTripLoading();

// Assert state
const state = getTripState();
expect(state.trips).toHaveLength(2);
expect(state.loading).toBe(false);
```

## Available Factories

| Factory | Creates | Example |
|---------|---------|---------|
| `createMockUser()` | Basic user | `createMockUser({ email: 'test@example.com' })` |
| `createMockAppleUser()` | Apple user | `createMockAppleUser()` |
| `createMockTrip()` | Basic trip | `createMockTrip({ name: 'Paris' })` |
| `createMockTripWithMembers()` | Trip with members | `createMockTripWithMembers(3)` |
| `createMockActiveTrip()` | Active trip | `createMockActiveTrip()` |
| `createMockMember()` | Trip member | `createMockMember({ role: 'admin' })` |
| `createMockInvitation()` | Invitation | `createMockInvitation({ email: 'user@example.com' })` |
| `createMockSession()` | Auth session | `createMockSession()` |

## Available Helpers

### Store Management
- `resetAllStores()` - Reset all store state
- `setupAuthenticatedUser(user, token?)` - Setup authenticated state
- `setupUnauthenticatedUser()` - Setup unauthenticated state  
- `getAuthState()` - Get current auth state
- `getTripState()` - Get current trip state
- `waitForAuthLoading()` - Wait for auth operations
- `waitForTripLoading()` - Wait for trip operations

### API Mocking
- `mockApiSuccess(data, status?)` - Mock successful API response
- `mockApiError(status, error)` - Mock API error response
- `mockNetworkError(message?)` - Mock network error
- `createMockAxios()` - Create mock axios instance
- `assertApiCall(mock, url, data?)` - Assert API was called

## Available Mocks

### Error Responses
- `VALIDATION_ERROR({ field: 'message' })` - Validation errors
- `AUTH_ERROR(code, message)` - Auth errors
- `RATE_LIMIT_ERROR(seconds)` - Rate limit errors
- `COMMON_AUTH_ERRORS` - Pre-defined auth errors
- `COMMON_RESOURCE_ERRORS` - Pre-defined resource errors
- `COMMON_SERVER_ERRORS` - Pre-defined server errors

### Supabase Responses
- `mockSuccessfulSignIn(session)` - Successful sign in
- `mockAuthError(message)` - Auth error
- `mockSessionExpired()` - Expired session
- `mockNoSession()` - No session
- `mockRefreshSuccess(session)` - Refresh success
- `mockRefreshError()` - Refresh error

## Test Template

```typescript
import { render } from '@/__tests__/test-utils';
import { createMockUser, createMockTrip } from '@/__tests__/factories';
import {
  resetAllStores,
  setupAuthenticatedUser,
  mockApiSuccess
} from '@/__tests__/helpers';
import { api } from '@/src/api/api-client';

describe('ComponentName', () => {
  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
  });

  describe('Feature', () => {
    it('does something', async () => {
      // Arrange
      const user = createMockUser();
      setupAuthenticatedUser(user);
      
      const mockData = [createMockTrip()];
      jest.spyOn(api, 'get').mockImplementation(() =>
        mockApiSuccess(mockData)
      );

      // Act
      const { getByText } = render(<ComponentName />);
      
      // Assert
      expect(getByText('Expected Text')).toBeDefined();
    });
  });
});
```

## Full Documentation

See `__tests__/README.md` for complete documentation with all patterns and examples.
