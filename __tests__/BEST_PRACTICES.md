# Jest + React Native + Zustand Testing Best Practices

> **Last Updated:** February 2025
> **Applies To:** NomadCrew Frontend (React Native/Expo with Zustand, React Query, Supabase, WebSocket)

This document provides comprehensive best practices for testing the NomadCrew frontend application after refactoring from a flat structure to a feature-based architecture.

---

## Table of Contents

1. [Zustand Store Testing](#1-zustand-store-testing)
2. [WebSocket/Real-time Testing](#2-websocketreal-time-testing)
3. [React Query Testing](#3-react-query-testing)
4. [Supabase Auth Mocking](#4-supabase-auth-mocking)
5. [Async State Management Testing](#5-async-state-management-testing)
6. [Feature-Based Architecture Testing](#6-feature-based-architecture-testing)
7. [Common Pitfalls and Solutions](#7-common-pitfalls-and-solutions)
8. [Complete Code Examples](#8-complete-code-examples)

---

## 1. Zustand Store Testing

### 1.1 The Official `__mocks__/zustand.ts` Pattern

The recommended approach from the [Zustand documentation](https://zustand.docs.pmnd.rs/guides/testing) is to create a mock file that automatically resets stores between tests.

**Create `__mocks__/zustand.ts`:**

```typescript
// __mocks__/zustand.ts
import { act } from '@testing-library/react-native';
import * as ZustandExportedTypes from 'zustand';

const { create: actualCreate, createStore: actualCreateStore } =
  jest.requireActual<typeof ZustandExportedTypes>('zustand');

// Store reset functions for cleanup between tests
export const storeResetFns = new Set<() => void>();

// Wrap the create function to capture initial state
const createUncurried = <T>(stateCreator: ZustandExportedTypes.StateCreator<T>) => {
  const store = actualCreate(stateCreator);
  const initialState = store.getInitialState();
  storeResetFns.add(() => {
    store.setState(initialState, true);
  });
  return store;
};

// Handle both curried and uncurried forms
export const create = (<T>(stateCreator: ZustandExportedTypes.StateCreator<T>) => {
  // Handle curried form: create()(stateCreator)
  if (stateCreator === undefined) {
    return createUncurried;
  }
  // Handle direct form: create(stateCreator)
  return createUncurried(stateCreator);
}) as typeof ZustandExportedTypes.create;

// Wrap createStore similarly
const createStoreUncurried = <T>(stateCreator: ZustandExportedTypes.StateCreator<T>) => {
  const store = actualCreateStore(stateCreator);
  const initialState = store.getInitialState();
  storeResetFns.add(() => {
    store.setState(initialState, true);
  });
  return store;
};

export const createStore = (<T>(stateCreator: ZustandExportedTypes.StateCreator<T>) => {
  if (stateCreator === undefined) {
    return createStoreUncurried;
  }
  return createStoreUncurried(stateCreator);
}) as typeof ZustandExportedTypes.createStore;

// Reset all stores after each test
afterEach(() => {
  act(() => {
    storeResetFns.forEach((resetFn) => {
      resetFn();
    });
  });
});
```

### 1.2 Testing Store Hooks with `renderHook`

```typescript
// Example: Testing a feature store
import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '@/src/features/auth/store';

describe('useAuthStore', () => {
  beforeEach(() => {
    // If using the __mocks__/zustand.ts pattern, stores reset automatically
    // Otherwise, manually reset:
    useAuthStore.setState({
      user: null,
      token: null,
      loading: false,
      error: null,
      status: 'unauthenticated',
    });
  });

  it('should update user on login', async () => {
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' });
    });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.user).toBeDefined();
  });

  it('should handle login errors', async () => {
    const { result } = renderHook(() => useAuthStore());

    // Mock the API to return an error
    jest.spyOn(authService, 'login').mockRejectedValueOnce(new Error('Invalid credentials'));

    await act(async () => {
      try {
        await result.current.login({ email: 'bad@example.com', password: 'wrong' });
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.error).toBe('Invalid credentials');
    expect(result.current.status).toBe('unauthenticated');
  });
});
```

### 1.3 Testing Stores with Middleware (persist, immer, devtools)

When using Zustand middleware, you need to mock storage APIs and potentially disable certain middleware in tests.

```typescript
// jest.setup.js - Mock localStorage for persist middleware
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock AsyncStorage for React Native persist
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));
```

**Testing a persisted store:**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTripStore } from '@/src/features/trips/store';

describe('useTripStore with persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should persist trips to storage', async () => {
    const { result } = renderHook(() => useTripStore());

    await act(async () => {
      result.current.addTrip({ id: 'trip-1', name: 'Paris' });
    });

    // Verify storage was called
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('should hydrate from storage on init', async () => {
    const storedState = JSON.stringify({
      state: { trips: [{ id: 'trip-1', name: 'Paris' }] },
      version: 0,
    });

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(storedState);

    // Re-import or manually trigger hydration
    const { result } = renderHook(() => useTripStore());

    // Wait for hydration
    await waitFor(() => {
      expect(result.current.trips).toHaveLength(1);
    });
  });
});
```

### 1.4 Zustand Store Subscriptions Testing

```typescript
import { useAuthStore } from '@/src/features/auth/store';

describe('Store Subscriptions', () => {
  it('should notify subscribers on state change', () => {
    const listener = jest.fn();

    // Subscribe to store changes
    const unsubscribe = useAuthStore.subscribe(listener);

    // Make a state change
    useAuthStore.setState({ loading: true });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ loading: true }),
      expect.anything()
    );

    unsubscribe();
  });

  it('should support selective subscriptions', () => {
    const listener = jest.fn();

    // Subscribe only to user changes
    const unsubscribe = useAuthStore.subscribe((state) => state.user, listener, {
      equalityFn: Object.is,
    });

    // This should NOT trigger the listener
    useAuthStore.setState({ loading: true });
    expect(listener).not.toHaveBeenCalled();

    // This SHOULD trigger the listener
    useAuthStore.setState({ user: { id: '1', email: 'test@test.com' } });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
```

---

## 2. WebSocket/Real-time Testing

### 2.1 Using jest-websocket-mock

Install the required packages:

```bash
npm install --save-dev jest-websocket-mock mock-socket
```

Reference: [jest-websocket-mock GitHub](https://github.com/romgain/jest-websocket-mock)

**Basic WebSocket mock setup:**

```typescript
// __tests__/websocket/connection.test.ts
import WS from 'jest-websocket-mock';
import { WebSocketManager } from '@/src/websocket/WebSocketManager';

describe('WebSocketManager', () => {
  let server: WS;
  let wsManager: WebSocketManager;

  beforeEach(async () => {
    // Create a mock WebSocket server
    server = new WS('ws://localhost:1234', { jsonProtocol: true });
    wsManager = new WebSocketManager('ws://localhost:1234');
  });

  afterEach(() => {
    WS.clean(); // Clean up all mock servers
    wsManager?.disconnect();
  });

  it('should connect to WebSocket server', async () => {
    wsManager.connect();
    await server.connected; // Wait for client to connect

    expect(wsManager.isConnected).toBe(true);
  });

  it('should send messages to server', async () => {
    wsManager.connect();
    await server.connected;

    wsManager.send({ type: 'PING' });

    await expect(server).toReceiveMessage({ type: 'PING' });
  });

  it('should receive messages from server', async () => {
    const messageHandler = jest.fn();
    wsManager.onMessage(messageHandler);

    wsManager.connect();
    await server.connected;

    server.send({ type: 'PONG', data: 'hello' });

    await waitFor(() => {
      expect(messageHandler).toHaveBeenCalledWith({ type: 'PONG', data: 'hello' });
    });
  });

  it('should handle disconnection', async () => {
    const disconnectHandler = jest.fn();
    wsManager.onDisconnect(disconnectHandler);

    wsManager.connect();
    await server.connected;

    server.close();

    await waitFor(() => {
      expect(disconnectHandler).toHaveBeenCalled();
      expect(wsManager.isConnected).toBe(false);
    });
  });

  it('should handle connection errors', async () => {
    const errorHandler = jest.fn();
    wsManager.onError(errorHandler);

    wsManager.connect();
    await server.connected;

    server.error();

    await waitFor(() => {
      expect(errorHandler).toHaveBeenCalled();
    });
  });
});
```

### 2.2 Testing Location Updates via WebSocket

```typescript
// __tests__/features/location/realtime.test.ts
import WS from 'jest-websocket-mock';
import { useLocationStore } from '@/src/features/location/store/useLocationStore';
import { LocationUpdateService } from '@/src/features/location/service';

describe('Real-time Location Updates', () => {
  let server: WS;
  let locationService: LocationUpdateService;

  beforeEach(async () => {
    server = new WS('ws://localhost:1234/location', { jsonProtocol: true });
    locationService = new LocationUpdateService('ws://localhost:1234/location');

    // Reset store
    useLocationStore.setState({
      memberLocations: {},
      myLocation: null,
      isTracking: false,
    });
  });

  afterEach(() => {
    WS.clean();
    locationService?.disconnect();
  });

  it('should broadcast location update', async () => {
    locationService.connect();
    await server.connected;

    const location = { lat: 48.8566, lng: 2.3522 };
    locationService.broadcastLocation(location);

    await expect(server).toReceiveMessage({
      type: 'LOCATION_UPDATE',
      payload: location,
    });
  });

  it('should update store when receiving member location', async () => {
    locationService.connect();
    await server.connected;

    // Simulate another member's location update
    server.send({
      type: 'MEMBER_LOCATION',
      payload: {
        userId: 'member-123',
        location: { lat: 51.5074, lng: -0.1278 },
      },
    });

    await waitFor(() => {
      const { memberLocations } = useLocationStore.getState();
      expect(memberLocations['member-123']).toEqual({
        lat: 51.5074,
        lng: -0.1278,
      });
    });
  });
});
```

### 2.3 Testing Chat WebSocket Integration

```typescript
// __tests__/features/chat/realtime.test.ts
import WS from 'jest-websocket-mock';
import { useChatStore } from '@/src/features/chat/store';
import { renderHook, act } from '@testing-library/react-native';

describe('Chat Real-time', () => {
  let server: WS;

  beforeEach(() => {
    server = new WS('ws://localhost:1234/chat', { jsonProtocol: true });
    useChatStore.setState({
      messages: [],
      isConnected: false,
      typingUsers: [],
    });
  });

  afterEach(() => {
    WS.clean();
  });

  it('should add incoming message to store', async () => {
    const { result } = renderHook(() => useChatStore());

    // Connect to chat
    await act(async () => {
      result.current.connect('trip-123');
    });
    await server.connected;

    // Simulate incoming message
    server.send({
      type: 'NEW_MESSAGE',
      payload: {
        id: 'msg-1',
        content: 'Hello!',
        senderId: 'user-456',
        timestamp: new Date().toISOString(),
      },
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Hello!');
    });
  });

  it('should handle typing indicators', async () => {
    const { result } = renderHook(() => useChatStore());

    await act(async () => {
      result.current.connect('trip-123');
    });
    await server.connected;

    server.send({
      type: 'USER_TYPING',
      payload: { userId: 'user-456', isTyping: true },
    });

    await waitFor(() => {
      expect(result.current.typingUsers).toContain('user-456');
    });
  });
});
```

---

## 3. React Query Testing

### 3.1 QueryClient Setup for Tests

Reference: [TanStack Query Testing Guide](https://tanstack.com/query/v4/docs/framework/react/guides/testing) and [TkDodo's Blog](https://tkdodo.eu/blog/testing-react-query)

```typescript
// __tests__/test-utils.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a new QueryClient for each test
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: 0, // Disable cache
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress error logging in tests
    },
  });

// Wrapper for testing hooks
export const createQueryWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Custom render that includes QueryClientProvider
export const renderWithQuery = (
  ui: React.ReactElement,
  options?: Parameters<typeof render>[1]
) => {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
    options
  );
};
```

### 3.2 Testing React Query Hooks

```typescript
// __tests__/hooks/useTrips.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useTrips } from '@/src/features/trips/hooks/useTrips';
import { createQueryWrapper } from '@/__tests__/test-utils';
import { api } from '@/src/api/api-client';

jest.mock('@/src/api/api-client');

describe('useTrips', () => {
  const wrapper = createQueryWrapper();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch trips successfully', async () => {
    const mockTrips = [
      { id: '1', name: 'Paris Trip' },
      { id: '2', name: 'Tokyo Trip' },
    ];

    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockTrips });

    const { result } = renderHook(() => useTrips(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTrips);
  });

  it('should handle fetch error', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTrips(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Network error');
  });
});
```

### 3.3 Testing Mutations and Cache Invalidation

```typescript
// __tests__/hooks/useCreateTrip.test.ts
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateTrip } from '@/src/features/trips/hooks/useCreateTrip';
import { api } from '@/src/api/api-client';

jest.mock('@/src/api/api-client');

describe('useCreateTrip', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should create trip and invalidate queries', async () => {
    const newTrip = { id: '1', name: 'New Trip' };
    (api.post as jest.Mock).mockResolvedValueOnce({ data: newTrip });

    // Pre-populate the cache
    queryClient.setQueryData(['trips'], []);

    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTrip(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: 'New Trip' });
    });

    expect(api.post).toHaveBeenCalledWith('/trips', { name: 'New Trip' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['trips'] });
  });
});
```

---

## 4. Supabase Auth Mocking

Reference: [Mocking Supabase Auth in React Apps](https://blog.stackademic.com/mocking-supabase-auth-in-react-app-ea2ba2c78c94)

### 4.1 Comprehensive Supabase Mock

```typescript
// __tests__/mocks/supabase.mock.ts
import { Session, User, AuthError } from '@supabase/supabase-js';

// Create mock user
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {
    firstName: 'Test',
    lastName: 'User',
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  ...overrides,
});

// Create mock session
export const createMockSession = (overrides?: Partial<Session>): Session => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: createMockUser(),
  ...overrides,
});

// Auth response types
export const mockSuccessfulSignIn = (session: Session) => ({
  data: { user: session.user, session },
  error: null,
});

export const mockAuthError = (message: string, status = 400) => ({
  data: { user: null, session: null },
  error: { message, status, name: 'AuthError' } as AuthError,
});

export const mockNoSession = () => ({
  data: { session: null },
  error: null,
});

export const mockSessionExpired = () => ({
  data: { session: null },
  error: { message: 'Session expired', status: 401, name: 'AuthSessionMissingError' },
});

export const mockSignUpPendingConfirmation = (email: string) => ({
  data: {
    user: createMockUser({ email, email_confirmed_at: undefined }),
    session: null,
  },
  error: null,
});

export const mockRefreshSuccess = (session: Session) => ({
  data: { user: session.user, session },
  error: null,
});

export const mockRefreshError = () => ({
  data: { user: null, session: null },
  error: { message: 'Refresh token expired', status: 401, name: 'AuthError' },
});

// Auth state change mock
export const mockAuthStateChange = (
  callback: (event: string, session: Session | null) => void
) => ({
  data: {
    subscription: {
      id: 'mock-subscription',
      callback,
      unsubscribe: jest.fn(),
    },
  },
});
```

### 4.2 Using Supabase Mocks in Tests

```typescript
// __tests__/features/auth/login.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '@/src/features/auth/store';
import { supabase } from '@/src/auth/supabaseClient';
import {
  createMockSession,
  mockSuccessfulSignIn,
  mockAuthError,
} from '@/__tests__/mocks/supabase.mock';

jest.mock('@/src/auth/supabaseClient');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Auth Login Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      status: 'unauthenticated',
      loading: false,
      error: null,
    });
  });

  it('should login successfully with email/password', async () => {
    const session = createMockSession();
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce(mockSuccessfulSignIn(session));

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.token).toBe('mock-access-token');
  });

  it('should handle invalid credentials', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce(
      mockAuthError('Invalid login credentials')
    );

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      try {
        await result.current.login({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        });
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.error).toBe('Invalid login credentials');
  });

  it('should restore session on app start', async () => {
    const session = createMockSession();
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session },
      error: null,
    });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.initializeAuth();
    });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.user).toBeDefined();
  });
});
```

---

## 5. Async State Management Testing

### 5.1 Using `waitFor` and `act` Correctly

Reference: [React Testing Library Async Utilities](https://testing-library.com/docs/dom-testing-library/api-async/)

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';

describe('Async Operations', () => {
  it('should wait for async state updates', async () => {
    const { result } = renderHook(() => useAuthStore());

    // Wrap async operations in act()
    await act(async () => {
      await result.current.fetchUser();
    });

    // Assert after async operation completes
    expect(result.current.user).toBeDefined();
  });

  it('should use waitFor for polling/retrying assertions', async () => {
    const { result } = renderHook(() => useTripStore());

    act(() => {
      result.current.fetchTrips(); // Fire and forget
    });

    // waitFor retries until condition is met or timeout
    await waitFor(
      () => {
        expect(result.current.trips).toHaveLength(3);
      },
      { timeout: 5000 }
    );
  });

  it('should test loading states', async () => {
    const { result } = renderHook(() => useAuthStore());

    // Start async operation
    const loginPromise = act(async () => {
      return result.current.login({ email: 'test@test.com', password: 'pass' });
    });

    // Check loading state immediately
    expect(result.current.loading).toBe(true);

    // Wait for completion
    await loginPromise;

    expect(result.current.loading).toBe(false);
  });
});
```

### 5.2 Testing with Fake Timers

```typescript
import { renderHook, act } from '@testing-library/react-native';

describe('Debounced/Throttled Operations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce location updates', async () => {
    const { result } = renderHook(() => useLocationStore());

    // Make multiple rapid calls
    act(() => {
      result.current.updateLocation({ lat: 1, lng: 1 });
      result.current.updateLocation({ lat: 2, lng: 2 });
      result.current.updateLocation({ lat: 3, lng: 3 });
    });

    // Fast-forward debounce timer
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Only the last update should have been sent
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/location', { lat: 3, lng: 3 });
  });

  it('should handle retry with exponential backoff', async () => {
    const { result } = renderHook(() => useApiStore());

    // Mock failing requests
    (api.get as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: 'success' });

    const fetchPromise = act(async () => {
      return result.current.fetchWithRetry('/data');
    });

    // First retry after 1000ms
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Second retry after 2000ms
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await fetchPromise;

    expect(result.current.data).toBe('success');
    expect(api.get).toHaveBeenCalledTimes(3);
  });
});
```

### 5.3 Testing Promise-based State Updates

```typescript
// Utility for controlled promise resolution
export const createDeferredPromise = <T>() => {
  let resolve: (value: T) => void;
  let reject: (error: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve: resolve!, reject: reject! };
};

describe('Promise Control in Tests', () => {
  it('should test intermediate states', async () => {
    const deferred = createDeferredPromise<User[]>();
    (api.get as jest.Mock).mockReturnValueOnce(deferred.promise);

    const { result } = renderHook(() => useTripStore());

    // Start fetch
    act(() => {
      result.current.fetchTrips();
    });

    // Assert loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.trips).toEqual([]);

    // Resolve the promise
    await act(async () => {
      deferred.resolve([{ id: '1', name: 'Trip' }]);
    });

    // Assert success state
    expect(result.current.loading).toBe(false);
    expect(result.current.trips).toHaveLength(1);
  });
});
```

---

## 6. Feature-Based Architecture Testing

### 6.1 Module Path Mapping for Feature Imports

Ensure your Jest config handles the new feature-based imports:

```javascript
// jest.config.js or package.json jest section
{
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/$1",
    "^@features/(.*)$": "<rootDir>/src/features/$1",
    "^@store/(.*)$": "<rootDir>/src/store/$1"
  }
}
```

### 6.2 Co-located Test Pattern

For feature-based architectures, consider co-locating tests with their features:

```
src/features/
  auth/
    __tests__/
      store.test.ts
      service.test.ts
      hooks.test.ts
    store.ts
    service.ts
    hooks/
    types.ts
  trips/
    __tests__/
      store.test.ts
      hooks.test.ts
    store.ts
    hooks/
    types.ts
```

Update testMatch in Jest config:

```javascript
{
  "testMatch": [
    "**/__tests__/**/*.test.{ts,tsx}",
    "**/*.test.{ts,tsx}",
    "**/src/features/**/__tests__/*.test.{ts,tsx}"
  ]
}
```

### 6.3 Testing Feature Store Integration

```typescript
// src/features/trips/__tests__/store.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useTripStore } from '../store';
import { tripService } from '../service';
import { createMockTrip } from '@/__tests__/factories';

jest.mock('../service');

describe('Trip Feature Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTripStore.setState({
      trips: [],
      selectedTrip: null,
      loading: false,
      error: null,
    });
  });

  describe('fetchTrips', () => {
    it('should fetch and store trips', async () => {
      const mockTrips = [createMockTrip(), createMockTrip({ id: 'trip-2' })];
      (tripService.getTrips as jest.Mock).mockResolvedValueOnce(mockTrips);

      const { result } = renderHook(() => useTripStore());

      await act(async () => {
        await result.current.fetchTrips();
      });

      expect(result.current.trips).toEqual(mockTrips);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('createTrip', () => {
    it('should create trip and add to store', async () => {
      const newTrip = createMockTrip({ name: 'New Trip' });
      (tripService.createTrip as jest.Mock).mockResolvedValueOnce(newTrip);

      const { result } = renderHook(() => useTripStore());

      await act(async () => {
        await result.current.createTrip({ name: 'New Trip', destination: 'Paris' });
      });

      expect(result.current.trips).toContainEqual(newTrip);
    });
  });
});
```

---

## 7. Common Pitfalls and Solutions

### 7.1 Shared Store State Between Tests

**Problem:** Tests affect each other because they share the same store instance.

**Solution:** Use the `__mocks__/zustand.ts` pattern or manually reset stores in `beforeEach`:

```typescript
beforeEach(() => {
  // Reset all stores to initial state
  useAuthStore.setState(useAuthStore.getInitialState(), true);
  useTripStore.setState(useTripStore.getInitialState(), true);
});
```

### 7.2 Act Warnings with Async Operations

**Problem:** "Warning: An update to Component inside a test was not wrapped in act(...)"

**Solution:** Always wrap state updates in `act()`:

```typescript
// Wrong
result.current.fetchData();

// Correct
await act(async () => {
  await result.current.fetchData();
});
```

### 7.3 React Query Cache Pollution

**Problem:** Cached data from one test affects another.

**Solution:** Create a new QueryClient for each test:

```typescript
let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
});
```

### 7.4 WebSocket Connection Cleanup

**Problem:** WebSocket connections persist between tests.

**Solution:** Always clean up in `afterEach`:

```typescript
afterEach(() => {
  WS.clean(); // Clean up all mock WebSocket servers
});
```

### 7.5 Timer-related Flakiness

**Problem:** Tests using `setTimeout`/`setInterval` are flaky.

**Solution:** Use Jest fake timers:

```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});
```

### 7.6 Import Path Resolution After Refactoring

**Problem:** Tests fail to find modules after moving to feature-based structure.

**Solution:** Update moduleNameMapper and ensure consistent import aliases:

```javascript
// jest.config.js
{
  "moduleNameMapper": {
    "^@/src/store/(.*)$": "<rootDir>/src/store/$1",
    "^@/src/features/(.*)$": "<rootDir>/src/features/$1",
    // Redirect old paths to new locations
    "^@/src/store/useAuthStore$": "<rootDir>/src/features/auth/store",
  }
}
```

### 7.7 Middleware Interference in Tests

**Problem:** Persist/devtools middleware causes issues in tests.

**Solution:** Mock the middleware or create test-specific stores:

```typescript
// For persist middleware, mock the storage
jest.mock('@react-native-async-storage/async-storage');

// For devtools, ensure it's disabled in test environment
const useStore = create(process.env.NODE_ENV !== 'test' ? devtools(stateCreator) : stateCreator);
```

---

## 8. Complete Code Examples

### 8.1 Full Feature Store Test Suite

```typescript
// src/features/auth/__tests__/store.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '../store';
import { authService } from '../service';
import { supabase } from '@/src/auth/supabaseClient';
import {
  createMockSession,
  createMockUser,
  mockSuccessfulSignIn,
  mockAuthError,
  mockNoSession,
} from '@/__tests__/mocks/supabase.mock';

// Mock dependencies
jest.mock('../service');
jest.mock('@/src/auth/supabaseClient');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Auth Store', () => {
  // Reset store state before each test
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      status: 'unauthenticated',
      loading: false,
      error: null,
      isInitialized: false,
    });
  });

  describe('initialization', () => {
    it('should initialize with existing session', async () => {
      const session = createMockSession();
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.status).toBe('authenticated');
      expect(result.current.user).toBeDefined();
    });

    it('should initialize without session', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce(mockNoSession());

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.status).toBe('unauthenticated');
      expect(result.current.user).toBeNull();
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const session = createMockSession();
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce(mockSuccessfulSignIn(session));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.current.status).toBe('authenticated');
      expect(result.current.token).toBe(session.access_token);
    });

    it('should handle invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce(
        mockAuthError('Invalid login credentials')
      );

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.login({
            email: 'wrong@example.com',
            password: 'wrongpassword',
          });
        })
      ).rejects.toThrow();

      expect(result.current.status).toBe('unauthenticated');
      expect(result.current.error).toContain('Invalid login credentials');
    });

    it('should show loading state during login', async () => {
      const session = createMockSession();
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      mockSupabase.auth.signInWithPassword.mockReturnValueOnce(loginPromise as any);

      const { result } = renderHook(() => useAuthStore());

      // Start login (don't await)
      const loginCall = act(async () => {
        return result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Check loading state
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve login
      resolveLogin!(mockSuccessfulSignIn(session));
      await loginCall;

      expect(result.current.loading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear user state on logout', async () => {
      // Setup authenticated state
      const session = createMockSession();
      useAuthStore.setState({
        user: session.user,
        token: session.access_token,
        status: 'authenticated',
        isInitialized: true,
      });

      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.status).toBe('unauthenticated');
    });
  });

  describe('session refresh', () => {
    it('should refresh expired session', async () => {
      const newSession = createMockSession({
        access_token: 'new-access-token',
      });

      mockSupabase.auth.refreshSession.mockResolvedValueOnce({
        data: { session: newSession, user: newSession.user },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(result.current.token).toBe('new-access-token');
    });
  });
});
```

### 8.2 WebSocket Service Test Suite

```typescript
// src/features/chat/__tests__/websocket.test.ts
import WS from 'jest-websocket-mock';
import { ChatWebSocketService } from '../websocket';
import { useChatStore } from '../store';

describe('ChatWebSocketService', () => {
  let server: WS;
  let chatService: ChatWebSocketService;

  beforeEach(async () => {
    // Create mock WebSocket server
    server = new WS('ws://localhost:1234/chat', { jsonProtocol: true });
    chatService = new ChatWebSocketService('ws://localhost:1234/chat');

    // Reset chat store
    useChatStore.setState({
      messages: [],
      isConnected: false,
      typingUsers: [],
      error: null,
    });
  });

  afterEach(() => {
    WS.clean();
    chatService?.disconnect();
  });

  describe('connection', () => {
    it('should connect to WebSocket server', async () => {
      chatService.connect('trip-123');
      await server.connected;

      expect(useChatStore.getState().isConnected).toBe(true);
    });

    it('should authenticate on connection', async () => {
      chatService.connect('trip-123', 'auth-token');
      await server.connected;

      await expect(server).toReceiveMessage({
        type: 'AUTH',
        payload: { token: 'auth-token', tripId: 'trip-123' },
      });
    });

    it('should handle connection error', async () => {
      chatService.connect('trip-123');
      await server.connected;

      server.error();

      await waitFor(() => {
        expect(useChatStore.getState().isConnected).toBe(false);
        expect(useChatStore.getState().error).toBeDefined();
      });
    });

    it('should reconnect on disconnection', async () => {
      jest.useFakeTimers();

      chatService.connect('trip-123');
      await server.connected;

      // Simulate server closing connection
      server.close();

      // Fast-forward reconnect timer
      jest.advanceTimersByTime(5000);

      // Create new server for reconnection
      server = new WS('ws://localhost:1234/chat', { jsonProtocol: true });

      await waitFor(() => {
        expect(useChatStore.getState().isConnected).toBe(true);
      });

      jest.useRealTimers();
    });
  });

  describe('messaging', () => {
    it('should send message to server', async () => {
      chatService.connect('trip-123');
      await server.connected;

      chatService.sendMessage('Hello, world!');

      await expect(server).toReceiveMessage({
        type: 'MESSAGE',
        payload: expect.objectContaining({
          content: 'Hello, world!',
        }),
      });
    });

    it('should add received message to store', async () => {
      chatService.connect('trip-123');
      await server.connected;

      server.send({
        type: 'NEW_MESSAGE',
        payload: {
          id: 'msg-1',
          content: 'Hello from server',
          senderId: 'user-456',
          senderName: 'John',
          timestamp: new Date().toISOString(),
        },
      });

      await waitFor(() => {
        const { messages } = useChatStore.getState();
        expect(messages).toHaveLength(1);
        expect(messages[0].content).toBe('Hello from server');
      });
    });

    it('should handle message history', async () => {
      chatService.connect('trip-123');
      await server.connected;

      server.send({
        type: 'MESSAGE_HISTORY',
        payload: [
          { id: 'msg-1', content: 'First', senderId: 'user-1', timestamp: '2024-01-01T00:00:00Z' },
          { id: 'msg-2', content: 'Second', senderId: 'user-2', timestamp: '2024-01-01T00:01:00Z' },
        ],
      });

      await waitFor(() => {
        expect(useChatStore.getState().messages).toHaveLength(2);
      });
    });
  });

  describe('typing indicators', () => {
    it('should send typing indicator', async () => {
      chatService.connect('trip-123');
      await server.connected;

      chatService.sendTypingIndicator(true);

      await expect(server).toReceiveMessage({
        type: 'TYPING',
        payload: { isTyping: true },
      });
    });

    it('should update typing users on indicator received', async () => {
      chatService.connect('trip-123');
      await server.connected;

      server.send({
        type: 'USER_TYPING',
        payload: { userId: 'user-456', userName: 'John', isTyping: true },
      });

      await waitFor(() => {
        expect(useChatStore.getState().typingUsers).toContain('John');
      });

      server.send({
        type: 'USER_TYPING',
        payload: { userId: 'user-456', userName: 'John', isTyping: false },
      });

      await waitFor(() => {
        expect(useChatStore.getState().typingUsers).not.toContain('John');
      });
    });
  });
});
```

### 8.3 Integrated Feature Test

```typescript
// __tests__/integration/trip-flow.test.ts
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WS from 'jest-websocket-mock';
import { TripDetailScreen } from '@/app/(app)/trips/[id]';
import { useAuthStore } from '@/src/features/auth/store';
import { useTripStore } from '@/src/features/trips/store';
import { api } from '@/src/api/api-client';
import { createMockTrip, createMockUser, createMockMember } from '@/__tests__/factories';

jest.mock('@/src/api/api-client');

describe('Trip Detail Integration', () => {
  let queryClient: QueryClient;
  let wsServer: WS;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wsServer = new WS('ws://localhost:1234/trip', { jsonProtocol: true });

    // Setup authenticated user
    const user = createMockUser();
    useAuthStore.setState({
      user,
      token: 'test-token',
      status: 'authenticated',
      isInitialized: true,
    });

    // Setup trip store
    const trip = createMockTrip({ id: 'trip-123', name: 'Paris Trip' });
    useTripStore.setState({
      trips: [trip],
      selectedTrip: trip,
      loading: false,
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    WS.clean();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it('should display trip details', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: createMockTrip({ id: 'trip-123', name: 'Paris Trip' }),
    });

    const { getByText } = renderWithProviders(
      <TripDetailScreen route={{ params: { id: 'trip-123' } }} />
    );

    await waitFor(() => {
      expect(getByText('Paris Trip')).toBeDefined();
    });
  });

  it('should show real-time member locations', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: createMockTrip({ id: 'trip-123' }),
    });

    const { getByTestId } = renderWithProviders(
      <TripDetailScreen route={{ params: { id: 'trip-123' } }} />
    );

    await wsServer.connected;

    // Simulate member location update
    wsServer.send({
      type: 'MEMBER_LOCATION',
      payload: {
        userId: 'member-1',
        location: { lat: 48.8566, lng: 2.3522 },
      },
    });

    await waitFor(() => {
      const map = getByTestId('trip-map');
      // Assert member marker is shown
      expect(map.props.markers).toContainEqual(
        expect.objectContaining({ userId: 'member-1' })
      );
    });
  });

  it('should handle member joining notification', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: createMockTrip({ id: 'trip-123' }),
    });

    const { getByText } = renderWithProviders(
      <TripDetailScreen route={{ params: { id: 'trip-123' } }} />
    );

    await wsServer.connected;

    // Simulate member join event
    wsServer.send({
      type: 'MEMBER_JOINED',
      payload: createMockMember({ userId: 'new-member', name: 'Jane' }),
    });

    await waitFor(() => {
      expect(getByText(/Jane joined/)).toBeDefined();
    });
  });
});
```

---

## Additional Resources

### Official Documentation

- [Zustand Testing Guide](https://zustand.docs.pmnd.rs/guides/testing) - Official testing patterns
- [TanStack Query Testing](https://tanstack.com/query/v4/docs/framework/react/guides/testing) - React Query test setup
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) - RNTL documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started) - Jest testing framework

### Community Resources

- [jest-websocket-mock](https://github.com/romgain/jest-websocket-mock) - WebSocket mocking for Jest
- [TkDodo's Testing React Query Blog](https://tkdodo.eu/blog/testing-react-query) - In-depth React Query testing
- [Testing React Native with Jest - Expo](https://docs.expo.dev/develop/unit-testing/) - Expo-specific testing guide

### Project-Specific Documentation

- [`__tests__/README.md`](./README.md) - Project test utilities documentation
- [`__tests__/examples/`](./examples/) - Usage examples for test helpers
- [`docs/07-development/testing.md`](../docs/07-development/testing.md) - Full testing guide

---

## Changelog

| Date       | Changes                                                    |
| ---------- | ---------------------------------------------------------- |
| 2025-02-04 | Initial document created with comprehensive best practices |
