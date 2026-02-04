# Auth Store Tests

## Overview

Comprehensive test suite for the authentication store (`useAuthStore.ts`) with **43 test cases** covering all authentication flows and edge cases.

## Test Coverage

- **Statement Coverage**: 89.4%
- **Branch Coverage**: 76.74%
- **Function Coverage**: 68.75%

## Test Categories

### 1. Initialize (5 tests)

- ✓ Session recovery with valid session
- ✓ Initialization without session
- ✓ Error handling during recovery
- ✓ Missing user metadata handling
- ✓ Exception handling

### 2. Register (4 tests)

- ✓ Successful registration with email verification
- ✓ Duplicate email error handling
- ✓ Registration with minimal fields
- ✓ Unknown error types

### 3. Login (4 tests)

- ✓ Successful login with full user data
- ✓ Invalid credentials error
- ✓ Missing session error
- ✓ Missing email in session

### 4. Refresh Session (5 tests)

- ✓ Successful token refresh
- ✓ No refresh token available
- ✓ Refresh error with state clearing
- ✓ Session returned without data
- ✓ getSession error handling

### 5. Logout (5 tests)

- ✓ Complete state clearing
- ✓ Local state clearing when Supabase fails
- ✓ AsyncStorage clearing
- ✓ Storage error handling
- ✓ Unexpected error handling

### 6. Google Sign-In (7 tests)

- ✓ Direct ID token format
- ✓ Nested user format
- ✓ Data wrapper format
- ✓ Authentication wrapper format
- ✓ Missing ID token error
- ✓ Supabase sign-in error
- ✓ Missing session in response

### 7. Apple Sign-In (3 tests)

- ✓ Successful authentication
- ✓ Minimal metadata handling
- ✓ Error handling

### 8. Additional Features (7 tests)

- ✓ First-time flag setting
- ✓ Push token registration with permission
- ✓ Push token without permission
- ✓ Push token error handling
- ✓ Push token without user
- ✓ Concurrent login attempts
- ✓ Special characters in tokens

### 9. State Consistency (3 tests)

- ✓ State during failed operations
- ✓ Error clearing on success
- ✓ Property preservation during logout

## Running Tests

```bash
# Run auth store tests
npm test -- __tests__/store/useAuthStore.test.ts

# Run with coverage
npm test -- __tests__/store/useAuthStore.test.ts --coverage

# Run in watch mode
npm test -- __tests__/store/useAuthStore.test.ts --watch
```

## Test Structure

The tests use:

- **jsdom environment** for localStorage support
- **Mocked dependencies**: Supabase, AsyncStorage, Notifications, API client
- **Direct Zustand store testing** (no React hooks required)
- **Comprehensive edge case coverage**

## Key Test Patterns

### 1. State Verification

```typescript
const state = useAuthStore.getState();
expect(state.user?.id).toBe('user-123');
expect(state.token).toBe('access-token');
```

### 2. Error Handling

```typescript
await expect(
  useAuthStore.getState().login({ email: 'wrong', password: 'wrong' })
).rejects.toThrow();
```

### 3. Mock Setup

```typescript
(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
  data: { session: mockSession },
  error: null,
});
```

## Edge Cases Covered

1. **Token Formats**: Multiple Google Sign-In response formats
2. **Error Scenarios**: Network failures, invalid credentials, expired tokens
3. **Missing Data**: Null emails, empty metadata, missing sessions
4. **Concurrent Operations**: Multiple simultaneous login attempts
5. **State Consistency**: Proper cleanup on errors, state preservation
6. **Storage Failures**: AsyncStorage errors, Supabase errors
7. **Special Characters**: Tokens with special characters

## Uncovered Code Paths

The remaining 10.6% uncovered code includes:

- Session recovery fallback logic (lines 122-138, 171-188)
- Some logger calls (line 42)
- Push token registration with project ID (lines 532-536)

These are either:

- Complex fallback paths rarely executed
- Environment-specific code (Expo project ID)
- Non-critical logging statements

## Maintenance Notes

- Tests use `@jest-environment jsdom` for localStorage support
- All async operations are properly awaited
- Mocks are cleared between tests
- State is reset before each test
- Console logs from the store are expected (not errors)

## Related Files

- **Implementation**: `/src/features/auth/store.ts`
- **Types**: `/src/features/auth/types.ts`
- **API Client**: `/src/api/api-client.ts`
- **Auth Service**: `/src/features/auth/service.ts`

## Last Updated

2026-02-04
