# Test Utilities Documentation

This directory contains comprehensive test utilities for the NomadCrew frontend application. These utilities provide consistent, reusable helpers for creating mock data, managing store state, and mocking API responses.

## Directory Structure

```
__tests__/
├── factories/           # Data factories for creating mock objects
│   ├── index.ts        # Central export for all factories
│   ├── user.factory.ts # User and auth-related factories
│   ├── trip.factory.ts # Trip and member factories
│   └── invitation.factory.ts # Invitation factories
├── helpers/            # Test helper utilities
│   ├── index.ts        # Central export for all helpers
│   ├── store-helpers.ts # Zustand store management
│   └── api-helpers.ts  # API mocking utilities
├── mocks/              # Mock implementations
│   ├── api-responses.ts # Standard API error responses
│   ├── supabase.mock.ts # Supabase client mocks
│   └── theme-compatibility.ts # Theme mocking
├── examples/           # Usage examples
│   └── test-helpers-usage.example.test.ts
└── test-utils.tsx      # Custom render with providers
```

## Quick Start

### Basic Test Setup

```typescript
import { render } from '@/__tests__/test-utils';
import { createMockUser, createMockTrip } from '@/__tests__/factories';
import { setupAuthenticatedUser, resetAllStores } from '@/__tests__/helpers';

describe('MyComponent', () => {
  beforeEach(() => {
    resetAllStores(); // Reset store state before each test
  });

  it('renders correctly', () => {
    const user = createMockUser();
    setupAuthenticatedUser(user);

    const { getByText } = render(<MyComponent />);
    expect(getByText('Welcome')).toBeDefined();
  });
});
```

## Factories

Factories create consistent mock data objects for testing.

### User Factories

```typescript
import {
  createMockUser,
  createMockAppleUser,
  createMockMinimalUser
} from '@/__tests__/factories';

// Basic user
const user = createMockUser();

// Custom user
const customUser = createMockUser({
  email: 'custom@example.com',
  firstName: 'John',
  lastName: 'Doe'
});

// Apple user
const appleUser = createMockAppleUser();

// Minimal user (only required fields)
const minimalUser = createMockMinimalUser();
```

### Trip Factories

```typescript
import {
  createMockTrip,
  createMockMember,
  createMockTripWithMembers,
  createMockActiveTrip,
  createMockCompletedTrip,
  createMockTripWithWeather
} from '@/__tests__/factories';

// Basic trip
const trip = createMockTrip();

// Custom trip
const parisTrip = createMockTrip({
  name: 'Paris Adventure',
  destination: {
    address: 'Paris, France',
    coordinates: { lat: 48.8566, lng: 2.3522 }
  }
});

// Trip with members
const tripWithMembers = createMockTripWithMembers(3); // owner + 3 members

// Trip with specific status
const activeTrip = createMockActiveTrip();
const completedTrip = createMockCompletedTrip();

// Trip with weather
const tripWithWeather = createMockTripWithWeather();

// Individual member
const member = createMockMember({
  userId: 'user-456',
  role: 'admin'
});
```

### Invitation Factories

```typescript
import {
  createMockInvitation,
  createMockAcceptedInvitation,
  createMockExpiredInvitation
} from '@/__tests__/factories';

const invitation = createMockInvitation({
  email: 'invitee@example.com'
});

const acceptedInvitation = createMockAcceptedInvitation();
const expiredInvitation = createMockExpiredInvitation();
```

## Store Helpers

Manage Zustand store state in tests.

### Setup and Reset

```typescript
import {
  resetAllStores,
  setupAuthenticatedUser,
  setupUnauthenticatedUser,
  setupAuthLoading,
  setupAuthError,
  getAuthState,
  getTripState
} from '@/__tests__/helpers';

// Reset all stores (call in beforeEach)
beforeEach(() => {
  resetAllStores();
});

// Setup authenticated user
const user = createMockUser();
setupAuthenticatedUser(user, 'test-token');

// Setup unauthenticated user
setupUnauthenticatedUser();

// Setup loading state
setupAuthLoading();

// Setup error state
setupAuthError('Authentication failed');

// Get current state
const authState = getAuthState();
const tripState = getTripState();
```

### Waiting for Async Operations

```typescript
import { waitForAuthLoading, waitForTripLoading } from '@/__tests__/helpers';

// Wait for auth to finish loading
await waitForAuthLoading();
expect(getAuthState().loading).toBe(false);

// Wait for trips to finish loading
await waitForTripLoading();
expect(getTripState().loading).toBe(false);
```

## API Helpers

Mock API responses for testing.

### Success Responses

```typescript
import { mockApiSuccess } from '@/__tests__/helpers';
import { api } from '@/src/api/api-client';

const mockTrips = [createMockTrip()];

jest.spyOn(api, 'get').mockImplementation(() =>
  mockApiSuccess(mockTrips)
);

const response = await api.get('/trips');
expect(response.data).toEqual(mockTrips);
```

### Error Responses

```typescript
import { mockApiError } from '@/__tests__/helpers';
import { AUTH_ERROR } from '@/__tests__/mocks/api-responses';

jest.spyOn(api, 'post').mockImplementation(() =>
  mockApiError(401, AUTH_ERROR('INVALID_CREDENTIALS', 'Invalid email or password'))
);

await expect(api.post('/auth/login', {})).rejects.toMatchObject({
  response: { status: 401 }
});
```

### Network Errors

```typescript
import { mockNetworkError } from '@/__tests__/helpers';

jest.spyOn(api, 'get').mockImplementation(() => mockNetworkError());

await expect(api.get('/trips')).rejects.toMatchObject({
  code: 'ERR_NETWORK'
});
```

### Mock Axios Instance

```typescript
import { createMockAxios, clearMockAxios } from '@/__tests__/helpers';

const mockAxios = createMockAxios();

mockAxios.get.mockResolvedValue({ data: { trips: [] } });
mockAxios.post.mockRejectedValue({ response: { status: 400 } });

afterEach(() => {
  clearMockAxios(mockAxios);
});
```

## API Response Mocks

Pre-defined error responses matching backend API.

### Common Errors

```typescript
import {
  VALIDATION_ERROR,
  AUTH_ERROR,
  RATE_LIMIT_ERROR,
  COMMON_AUTH_ERRORS,
  COMMON_RESOURCE_ERRORS,
  COMMON_SERVER_ERRORS,
  NETWORK_ERROR
} from '@/__tests__/mocks/api-responses';

// Validation error
const validationError = VALIDATION_ERROR({
  email: 'Invalid email format',
  password: 'Password too short'
});

// Auth error
const authError = AUTH_ERROR('INVALID_CREDENTIALS', 'Invalid email or password');

// Rate limit error
const rateLimitError = RATE_LIMIT_ERROR(60);

// Common errors
const { INVALID_CREDENTIALS, SESSION_EXPIRED } = COMMON_AUTH_ERRORS;
const { NOT_FOUND, FORBIDDEN } = COMMON_RESOURCE_ERRORS;
const { INTERNAL_ERROR } = COMMON_SERVER_ERRORS;

// Network error
const networkError = NETWORK_ERROR('Failed to connect');
```

## Supabase Mocks

Mock Supabase authentication flows.

### Basic Setup

```typescript
import { supabase } from '@/src/auth/supabaseClient';
import {
  createMockSession,
  mockSuccessfulSignIn,
  mockAuthError
} from '@/__tests__/mocks/supabase.mock';

jest.mock('@/src/auth/supabaseClient');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
```

### Sign In Flows

```typescript
// Successful sign in
const session = createMockSession();
mockSupabase.auth.signInWithPassword.mockResolvedValue(
  mockSuccessfulSignIn(session)
);

// Failed sign in
mockSupabase.auth.signInWithPassword.mockResolvedValue(
  mockAuthError('Invalid credentials')
);

// Custom session
const customSession = createMockSession({
  user: {
    email: 'custom@example.com',
    user_metadata: { username: 'customuser' }
  } as any
});
```

### Other Auth Flows

```typescript
import {
  mockSessionExpired,
  mockSignUpPendingConfirmation,
  mockGoogleSignInSuccess,
  mockNoSession,
  mockRefreshSuccess,
  mockRefreshError
} from '@/__tests__/mocks/supabase.mock';

// Session expired
mockSupabase.auth.getSession.mockResolvedValue(mockSessionExpired());

// Sign up pending confirmation
mockSupabase.auth.signUp.mockResolvedValue(
  mockSignUpPendingConfirmation('test@example.com')
);

// Google sign in
mockSupabase.auth.signInWithIdToken.mockResolvedValue(
  mockGoogleSignInSuccess(session)
);

// No session
mockSupabase.auth.getSession.mockResolvedValue(mockNoSession());

// Refresh success
mockSupabase.auth.refreshSession.mockResolvedValue(
  mockRefreshSuccess(newSession)
);

// Refresh error
mockSupabase.auth.refreshSession.mockResolvedValue(mockRefreshError());
```

## Advanced Patterns

### Retry Logic Testing

```typescript
import { createRetryMock } from '@/__tests__/helpers';
import { COMMON_SERVER_ERRORS } from '@/__tests__/mocks/api-responses';

// Fail twice, then succeed
const mockFn = createRetryMock(
  2,
  { response: { status: 500, data: COMMON_SERVER_ERRORS.INTERNAL_ERROR } },
  { data: { success: true } }
);

jest.spyOn(api, 'post').mockImplementation(mockFn);

// First two calls fail, third succeeds
await expect(api.post('/endpoint')).rejects.toBeDefined();
await expect(api.post('/endpoint')).rejects.toBeDefined();
await expect(api.post('/endpoint')).resolves.toMatchObject({
  data: { success: true }
});
```

### Delayed Responses

```typescript
import { delay } from '@/__tests__/helpers';

jest.spyOn(api, 'get').mockImplementation(() =>
  delay(1000, { data: trips })
);

// Response will be delayed by 1 second
```

### Asserting API Calls

```typescript
import { assertApiCall } from '@/__tests__/helpers';

jest.spyOn(api, 'post');

await useTripStore.getState().createTrip(tripData);

assertApiCall(api.post, '/trips', tripData);
```

## Integration Test Example

```typescript
import { render } from '@/__tests__/test-utils';
import { createMockUser, createMockTrip } from '@/__tests__/factories';
import { setupAuthenticatedUser, resetAllStores } from '@/__tests__/helpers';
import { mockApiSuccess } from '@/__tests__/helpers';
import { api } from '@/src/api/api-client';
import { useTripStore } from '@/src/store/useTripStore';

describe('Trip List Integration', () => {
  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
  });

  it('loads and displays trips for authenticated user', async () => {
    // Setup: Authenticated user
    const user = createMockUser();
    setupAuthenticatedUser(user);

    // Mock: API returns trips
    const trips = [
      createMockTrip({ name: 'Paris Trip' }),
      createMockTrip({ name: 'Tokyo Trip', id: 'trip-456' })
    ];

    jest.spyOn(api, 'get').mockImplementation(() =>
      mockApiSuccess(trips)
    );

    // Render: Component
    const { getByText } = render(<TripList />);

    // Execute: Load trips
    await useTripStore.getState().fetchTrips();

    // Assert: Trips are displayed
    expect(getByText('Paris Trip')).toBeDefined();
    expect(getByText('Tokyo Trip')).toBeDefined();
  });
});
```

## Best Practices

### 1. Reset State Between Tests

```typescript
beforeEach(() => {
  resetAllStores();
  jest.clearAllMocks();
});
```

### 2. Use Factories for Consistency

```typescript
// Good: Use factories
const user = createMockUser({ email: 'test@example.com' });

// Bad: Manual object creation
const user = {
  id: 'user-123',
  email: 'test@example.com',
  // Missing required fields...
};
```

### 3. Setup Store State Explicitly

```typescript
// Good: Explicit setup
setupAuthenticatedUser(createMockUser());

// Bad: Direct state mutation
useAuthStore.setState({ user: { ...someUser } });
```

### 4. Use Standard Error Responses

```typescript
// Good: Standard errors
mockApiError(401, COMMON_AUTH_ERRORS.INVALID_CREDENTIALS);

// Bad: Custom error format
mockApiError(401, { error: 'bad creds' });
```

### 5. Test Async Operations

```typescript
// Good: Wait for completion
await useTripStore.getState().fetchTrips();
expect(getTripState().loading).toBe(false);

// Bad: Don't wait
useTripStore.getState().fetchTrips();
expect(getTripState().loading).toBe(false); // Might still be loading!
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- trip.test.ts

# Run in watch mode
npm test -- --watch
```

## Coverage Requirements

- Overall: 80% minimum
- Critical paths: 90% minimum (auth, trips)
- New features: 100% coverage required

## Related Documentation

- Main Testing Guide: `/docs/07-development/testing.md`
- Backend API Reference: `/docs/03-reference/backend/api/`
- Frontend Components: `/docs/03-reference/frontend/components/`

## Contributing

When adding new test utilities:

1. Follow existing patterns and naming conventions
2. Add JSDoc comments with examples
3. Update this README
4. Add usage examples in `examples/` directory
5. Ensure type safety (no `any` types)

## Questions?

See `/docs/14-troubleshooting/frontend-testing.md` for common issues and solutions.
