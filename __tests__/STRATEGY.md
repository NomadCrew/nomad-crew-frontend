# Test Fix Strategy Document

## Executive Summary

After analyzing 9 failing test suites, we have identified **four distinct root causes** requiring different remediation strategies. The tests fall into three priority tiers based on complexity and downstream dependencies.

---

## Root Causes Identified

### 1. Module Import Chain Issues (Critical - Affects 6 test suites)

**Affected Tests:**

- `__tests__/store/useAuthStore.test.ts`
- `__tests__/store/useLocationStore.test.ts`
- `__tests__/store/useChatStore.test.ts`
- `__tests__/store/useTripStore.test.ts`
- `__tests__/store/invitation.test.ts`
- `__tests__/examples/test-helpers-usage.example.test.ts`

**Problem:**
The stores were refactored to feature-based architecture:

- `src/features/auth/store.ts` is the canonical auth store location
- `src/features/auth/store.ts` imports from `src/features/auth/service.ts`
- `src/features/auth/service.ts` contains a **runtime validation** that throws if Supabase env vars are missing:
  ```typescript
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for Auth Service');
  }
  ```

**Note:** The `src/store/useAuthStore.ts` shim has been removed. All imports now use `@/src/features/auth/store` directly.

**Why Current Mocks Fail:**
The `jest.setup.js` sets `process.env.EXPO_PUBLIC_SUPABASE_URL` and `process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY` at the top, but the module is loaded **before** the mock can intercept. The real `src/features/auth/service.ts` is evaluated, causing the throw.

**Impact Chain:**

```
useAuthStore.test.ts
  -> @/src/features/auth/store
    -> @/src/features/auth/service (THROWS - env vars not available at module load time)
```

---

### 2. API Error Handling Test Logic Mismatches (Medium - 1 test suite)

**Affected Tests:**

- `__tests__/api/error-handling.test.ts`

**Problem:**
The API client (`src/api/base-client.ts`) has been modified with:

- Updated error message formatting (now returns user-friendly messages)
- Changed token refresh flow behavior
- Modified network error handling

**Specific Failures:**

1. Token refresh tests expect different behavior than implemented
2. Error messages have changed (e.g., "Your session has expired. Please wait..." instead of raw messages)
3. Network error handling now returns "No response from server. Please check your connection."
4. Rate limit handling returns different error structure

**Example Mismatch:**

```typescript
// Test expects:
expect(error.message).toContain('internal server error');

// Actual ApiError returns:
message: 'Your session has expired. Please wait while we refresh your session.';
```

---

### 3. Notification Module API Changes (Medium - 1 test suite)

**Affected Tests:**

- `src/features/notifications/__tests__/notification-integration.test.ts`

**Problems:**

1. **Missing Function:** Test imports `parseNotification` but the module exports `safeParseNotification`

   ```typescript
   // Test imports (WRONG):
   import { parseNotification } from '../types/notification';

   // Module exports (CORRECT):
   export const safeParseNotification = (data: unknown): Notification | null
   ```

2. **Schema Changes:** The notification schema has been completely rewritten using Zod:
   - New field names (e.g., `tripID` instead of `tripId`)
   - New notification types (e.g., `TRIP_INVITATION_RECEIVED`)
   - Different metadata structure (camelCase with ID suffix)

3. **Store API Changes:** `handleTripUpdateAction` method does not exist on `useNotificationStore`

4. **Missing Property:** `latestLocationUpdate` is `null` instead of being set

---

### 4. API Retry Strategy Test Timing Issues (Low - 1 test suite)

**Affected Tests:**

- `__tests__/api/retry-strategy.test.ts`

**Problems:**

- Many tests use `jest.useFakeTimers()` but the actual API client behavior has changed
- Token refresh flow expects different getToken mock return sequence
- Tests document expected behavior that isn't implemented (comments indicate awareness)

---

## Prioritized Fix Order

### Tier 1: Critical Path (Fix First)

These block all other test suites.

| Order | Test Suite                       | Fix Complexity | Time Estimate |
| ----- | -------------------------------- | -------------- | ------------- |
| 1     | `jest.setup.js` + Module Mocking | Medium         | 1-2 hours     |

**Strategy:**
The auth service module must be mocked **before** any import can trigger its loading. Two approaches:

**Option A: Mock the entire auth service (Recommended)**

```typescript
// In jest.setup.js, add BEFORE any imports:
jest.mock('@/src/features/auth/service', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithIdToken: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
  refreshSupabaseSession: jest.fn(),
  registerPushTokenService: jest.fn(),
  deregisterPushTokenService: jest.fn(),
}));
```

**Option B: Create a manual mock**
Create `__mocks__/src/features/auth/service.ts` with mock implementations.

---

### Tier 2: Store Tests (Fix Second)

After Tier 1, these should work or need minor adjustments.

| Order | Test Suite                 | Fix Complexity | Time Estimate |
| ----- | -------------------------- | -------------- | ------------- |
| 2     | `useAuthStore.test.ts`     | Low            | 30 min        |
| 3     | `useTripStore.test.ts`     | Low            | 30 min        |
| 4     | `useLocationStore.test.ts` | Low            | 30 min        |
| 5     | `useChatStore.test.ts`     | Low            | 30 min        |
| 6     | `invitation.test.ts`       | Low            | 30 min        |

**Strategy:**
After fixing Tier 1, verify existing mocks in each test file are compatible with the new store structure. Key checks:

- Verify `useAuthStore.setState()` still works with the re-exported store
- Verify mock paths match actual import paths

---

### Tier 3: API Tests (Fix Third)

| Order | Test Suite               | Fix Complexity | Time Estimate |
| ----- | ------------------------ | -------------- | ------------- |
| 7     | `error-handling.test.ts` | Medium         | 1-2 hours     |
| 8     | `retry-strategy.test.ts` | Medium         | 1-2 hours     |

**Strategy:**
Update test expectations to match actual API client behavior:

1. **Update Error Message Assertions:**

   ```typescript
   // OLD:
   expect(error.message).toContain('internal server error');

   // NEW (match actual ApiError messages):
   expect(error.code).toBe('INTERNAL_SERVER_ERROR');
   // or
   expect(error.response?.data?.code).toBe('INTERNAL_SERVER_ERROR');
   ```

2. **Update Token Refresh Tests:**
   - The actual implementation uses `ApiError` class with specific codes
   - Adjust mock sequences for `getToken` calls
   - Update expected rejection messages

3. **Handle Network Error Changes:**

   ```typescript
   // OLD:
   expect(error.message).toContain('Authentication required');

   // NEW:
   expect(error.message).toContain('No response from server');
   ```

---

### Tier 4: Notification Tests (Fix Fourth)

| Order | Test Suite                         | Fix Complexity | Time Estimate |
| ----- | ---------------------------------- | -------------- | ------------- |
| 9     | `notification-integration.test.ts` | High           | 2-3 hours     |

**Strategy:**
Major rewrite needed to match new notification system:

1. **Fix Import:**

   ```typescript
   // Change from:
   import { parseNotification } from '../types/notification';

   // To:
   import { safeParseNotification } from '../types/notification';
   ```

2. **Update Test Data to Match New Schema:**

   ```typescript
   // OLD format:
   {
     id: '...',
     type: 'TRIP_UPDATE',
     priority: 'HIGH',
     data: {
       tripId: 'trip-123',
       tripName: 'Summer Vacation',
       updateType: 'trip_created',
       updatedBy: 'John Doe',
     },
     read: false,
     createdAt: '2024-01-01T00:00:00Z',
   }

   // NEW format (Zod schema):
   {
     id: '123e4567-e89b-12d3-a456-426614174000', // Must be valid UUID
     type: 'TRIP_UPDATE',
     message: 'Trip was updated', // Required field
     metadata: {
       tripID: 'trip-123', // Note: ID suffix, not tripId
       tripName: 'Summer Vacation',
       updaterName: 'John Doe', // Different field name
       changedFields: ['status'], // Required array
     },
     read: false,
     createdAt: '2024-01-01T00:00:00+00:00', // Must include timezone
   }
   ```

3. **Remove Non-Existent Method Tests:**
   - `handleTripUpdateAction` does not exist on the store
   - Either remove these tests or implement the method

4. **Fix Store State Assertions:**
   - `latestLocationUpdate` may need investigation into why it's null

---

### Tier 5: Example Tests (Fix Last)

| Order | Test Suite                           | Fix Complexity | Time Estimate |
| ----- | ------------------------------------ | -------------- | ------------- |
| 10    | `test-helpers-usage.example.test.ts` | Low            | 15 min        |

**Strategy:**
After all other fixes, this should work. It depends on:

- Proper auth service mocking (Tier 1)
- Supabase mock helpers working correctly

---

## Common Patterns to Apply

### Pattern 1: Pre-Import Module Mocking

For any test that imports stores, add the auth service mock at the **very top** of the test file or ensure jest.setup.js mocks it first.

### Pattern 2: Error Message Verification

Instead of checking error messages (which are now user-friendly), check error codes:

```typescript
try {
  await api.get('/endpoint');
} catch (error) {
  expect(error.code).toBe('EXPECTED_CODE');
}
```

### Pattern 3: Store Reset Pattern

The `resetAllStores()` helper in `__tests__/helpers/store-helpers.ts` may need updating if store state shape changed.

### Pattern 4: Notification Schema Compliance

All notification test data must comply with Zod schemas:

- UUIDs for IDs
- ISO 8601 timestamps with timezone
- Correct field names (ID suffix convention)
- Required `message` field
- Correct `metadata` structure per type

---

## Risks and Considerations

### Risk 1: Cascading Changes

Fixing the auth service mock in `jest.setup.js` may break tests that have their own auth service mocks. Need to ensure per-test mocks can override global mock.

### Risk 2: Breaking Production Behavior

When updating test expectations to match actual behavior, ensure we're testing the _intended_ behavior, not just _current_ behavior. Review API error handling changes to confirm they're correct.

### Risk 3: Notification Schema Rigidity

The new Zod-based notification schema is strict. Tests may need significant data updates. Consider adding test-specific factory functions.

### Risk 4: Timer/Async Handling

The API retry tests use fake timers which may conflict with real async operations in the refactored code.

---

## Recommended Approach

1. **Start with `jest.setup.js`** - Fix the global mock issue first
2. **Run all tests** - See which pass after the fix
3. **Fix remaining tests** in priority order
4. **Add missing factory functions** for notifications if needed
5. **Document any behavioral changes** discovered during fixes

---

## Appendix: File Locations

### Source Files (New Structure)

- `src/features/auth/store.ts` - Main auth store
- `src/features/auth/service.ts` - Auth service with Supabase client
- `src/features/auth/types.ts` - Auth types
- `src/features/notifications/store/useNotificationStore.ts` - Notification store
- `src/features/notifications/types/notification.ts` - Notification Zod schemas

### Compatibility Re-exports

- `src/store/useTripStore.ts` - Re-exports from features/trips/store
- `src/store/useLocationStore.ts` - (Check if re-export or original)
- `src/store/useChatStore.ts` - (Check if re-export or original)

Note: The `src/store/useAuthStore.ts` shim was removed. Use `@/src/features/auth/store` directly.

### Test Infrastructure

- `jest.setup.js` - Global test setup
- `__tests__/helpers/store-helpers.ts` - Store test utilities
- `__tests__/helpers/api-helpers.ts` - API test utilities
- `__tests__/factories/` - Test data factories
- `__tests__/mocks/` - Mock implementations

---

_Document created: Test Fix Strategy for NomadCrew Frontend_
_Date: 2024_
_Author: Test Fix Manager/Orchestrator_
