# Testing Patterns

**Analysis Date:** 2026-01-10

## Test Framework

**Runner:**
- Jest 29.7 (`package.json`)
- jest-expo preset for React Native/Expo compatibility
- Config in `package.json` (jest field)

**Assertion Library:**
- Jest built-in expect
- `@testing-library/jest-native` matchers for RN components

**Run Commands:**
```bash
npm test                              # Run all tests
npm run test:watch                    # Watch mode
npm run test:coverage                 # Coverage report
npm run test:e2e                      # Maestro E2E tests
npm run test:e2e:smoke                # Smoke test only
```

## Test File Organization

**Location:**
- `__tests__/` directory at project root (separate from source)
- Tests organized by type: `api/`, `store/`, `hooks/`, `permissions/`
- Component tests in `components/__tests__/`

**Naming:**
- `{name}.test.ts` for unit tests
- `{name}.test.tsx` for component tests
- No distinction between unit/integration in filename

**Structure:**
```
__tests__/
├── api/
│   ├── api-error.test.ts
│   ├── error-handling.test.ts
│   └── retry-strategy.test.ts
├── store/
│   ├── useAuthStore.test.ts
│   ├── useChatStore.test.ts
│   ├── useLocationStore.test.ts
│   └── useTripStore.test.ts
├── hooks/
│   └── useCancellableRequest.test.ts
├── permissions/
│   └── ability.test.ts
├── factories/               # Test data factories
├── helpers/                 # Test utilities
├── mocks/                   # Mock implementations
└── App.test.tsx
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('ModuleName', () => {
  describe('functionName', () => {
    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
    });

    it('should handle valid input', () => {
      // arrange
      const input = createTestInput();

      // act
      const result = functionName(input);

      // assert
      expect(result).toEqual(expectedOutput);
    });

    it('should throw on invalid input', () => {
      expect(() => functionName(null)).toThrow('Invalid input');
    });
  });
});
```

**Patterns:**
- Use `beforeEach` for per-test setup
- Clear mocks with `jest.clearAllMocks()`
- Arrange/Act/Assert pattern for clarity
- One logical assertion per test (multiple expects OK)

## Mocking

**Framework:**
- Jest built-in mocking (`jest.mock()`, `jest.fn()`)
- Mocks configured in `jest.setup.js`

**Global Mocks (jest.setup.js):**
```typescript
// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/src/auth/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      // ...
    },
  },
}));
```

**What to Mock:**
- Expo modules (expo-secure-store, expo-notifications, expo-router)
- Supabase client
- AsyncStorage
- React Native Reanimated
- Network requests (fetch)
- React Query persisters

**What NOT to Mock:**
- Pure utility functions
- Type definitions
- Zustand stores (test actual behavior)

## Fixtures and Factories

**Test Data:**
```typescript
// __tests__/factories/user.ts
export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    ...overrides,
  };
}

// __tests__/factories/trip.ts
export function createTestTrip(overrides?: Partial<Trip>): Trip {
  return {
    id: 'test-trip-id',
    name: 'Test Trip',
    status: 'ACTIVE',
    ...overrides,
  };
}
```

**Location:**
- Factory functions: `__tests__/factories/`
- Mock data: Inline in tests or factories
- Shared mocks: `__tests__/mocks/`

## Coverage

**Requirements:**
- No enforced coverage threshold
- Coverage tracked for awareness
- Focus on critical paths (stores, auth, API)

**Configuration:**
```json
"collectCoverageFrom": [
  "**/*.{js,jsx,ts,tsx}",
  "!**/coverage/**",
  "!**/node_modules/**",
  "!**/babel.config.js",
  "!**/jest.setup.js"
]
```

**View Coverage:**
```bash
npm run test:coverage
# Open coverage/lcov-report/index.html
```

## Test Types

**Unit Tests:**
- Test single function/method in isolation
- Mock all external dependencies
- Fast execution (<100ms per test)
- Examples: `__tests__/api/api-error.test.ts`, `__tests__/permissions/ability.test.ts`

**Store Tests:**
- Test Zustand store behavior
- Mock API calls and external services
- Test state changes and actions
- Examples: `__tests__/store/useAuthStore.test.ts`, `__tests__/store/useTripStore.test.ts`

**Hook Tests:**
- Test custom hooks behavior
- Use `@testing-library/react-native`
- Examples: `__tests__/hooks/useCancellableRequest.test.ts`

**E2E Tests:**
- Maestro for mobile E2E testing
- Flows defined in `.maestro/flows/`
- Run: `npm run test:e2e`

## Common Patterns

**Async Testing:**
```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

**Error Testing:**
```typescript
it('should throw on invalid input', () => {
  expect(() => parse(null)).toThrow('Cannot parse null');
});

// Async error
it('should reject on failure', async () => {
  await expect(asyncCall()).rejects.toThrow('error message');
});
```

**Store Testing:**
```typescript
import { useAuthStore } from '@/src/features/auth/store';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      status: 'unauthenticated',
    });
  });

  it('should login successfully', async () => {
    // Mock Supabase response
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    await useAuthStore.getState().login(credentials);

    expect(useAuthStore.getState().status).toBe('authenticated');
  });
});
```

**Mock Verification:**
```typescript
it('should call API with correct params', async () => {
  await store.fetchTrips();

  expect(mockApi.get).toHaveBeenCalledWith('/trips');
  expect(mockApi.get).toHaveBeenCalledTimes(1);
});
```

## Test Utilities

**Helper Location:** `__tests__/helpers/`

**Common Utilities:**
- Test data factories (`__tests__/factories/`)
- Mock implementations (`__tests__/mocks/`)
- Theme/provider wrappers if needed

**Example Usage:**
```typescript
import { createTestUser } from '../factories/user';
import { createTestTrip } from '../factories/trip';

it('should handle trip with user', () => {
  const user = createTestUser({ id: 'owner-id' });
  const trip = createTestTrip({ ownerId: user.id });
  // ...
});
```

---

*Testing analysis: 2026-01-10*
*Update when test patterns change*
