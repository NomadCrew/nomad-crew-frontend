import { Session } from '@supabase/supabase-js';

/**
 * Supabase Client Mock
 *
 * Creates a mock Supabase client for testing authentication flows.
 * All methods return Jest mock functions that can be configured in tests.
 *
 * @example
 * // In test setup
 * jest.mock('@/src/api/supabase', () => ({
 *   supabase: createSupabaseMock()
 * }));
 *
 * @example
 * // In test
 * const { supabase } = require('@/src/api/supabase');
 * supabase.auth.signInWithPassword.mockResolvedValue(
 *   mockSuccessfulSignIn(createMockSession())
 * );
 */
export const createSupabaseMock = () => ({
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signInWithIdToken: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    refreshSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    })),
  },
});

/**
 * Creates a mock Supabase session object.
 *
 * @param overrides - Partial session properties to override defaults
 * @returns A mock Session object
 *
 * @example
 * const session = createMockSession({
 *   user: { email: 'custom@example.com' }
 * });
 */
export const createMockSession = (overrides: Partial<Session> = {}): Session =>
  ({
    access_token: 'mock-access-token-123',
    refresh_token: 'mock-refresh-token-456',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: 'user-123',
      app_metadata: {},
      user_metadata: {
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'test@example.com',
      ...overrides.user,
    },
    ...overrides,
  }) as Session;

/**
 * Creates a successful sign-in response.
 *
 * @param session - The session to return
 * @returns A successful sign-in response object
 *
 * @example
 * supabase.auth.signInWithPassword.mockResolvedValue(
 *   mockSuccessfulSignIn(createMockSession())
 * );
 */
export const mockSuccessfulSignIn = (session: Session) => ({
  data: { session, user: session.user },
  error: null,
});

/**
 * Creates an authentication error response.
 *
 * @param message - Error message
 * @param code - Optional error code
 * @returns An error response object
 *
 * @example
 * supabase.auth.signInWithPassword.mockResolvedValue(
 *   mockAuthError('Invalid credentials')
 * );
 */
export const mockAuthError = (message: string, code?: string) => ({
  data: { session: null, user: null },
  error: { message, code, name: 'AuthError', status: 400 },
});

/**
 * Creates a session expired error response.
 *
 * @returns An expired session error response
 *
 * @example
 * supabase.auth.getSession.mockResolvedValue(mockSessionExpired());
 */
export const mockSessionExpired = () => mockAuthError('Session expired', 'SESSION_EXPIRED');

/**
 * Creates a successful sign-up response (email confirmation required).
 *
 * @param email - User's email
 * @returns A sign-up response requiring email confirmation
 *
 * @example
 * supabase.auth.signUp.mockResolvedValue(
 *   mockSignUpPendingConfirmation('test@example.com')
 * );
 */
export const mockSignUpPendingConfirmation = (email: string) => ({
  data: {
    user: {
      id: 'user-pending-123',
      email,
      user_metadata: {},
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      confirmation_sent_at: new Date().toISOString(),
    },
    session: null,
  },
  error: null,
});

/**
 * Creates a successful Google OAuth response.
 *
 * @param session - The session to return
 * @returns A successful OAuth response
 *
 * @example
 * supabase.auth.signInWithIdToken.mockResolvedValue(
 *   mockGoogleSignInSuccess(createMockSession())
 * );
 */
export const mockGoogleSignInSuccess = (session: Session) => ({
  data: { session, user: session.user },
  error: null,
});

/**
 * Creates a mock Google sign-in response object (from Google SDK).
 *
 * @param overrides - Properties to override
 * @returns A Google sign-in response
 *
 * @example
 * const googleResponse = createMockGoogleResponse({
 *   user: { email: 'google@example.com' }
 * });
 */
export const createMockGoogleResponse = (overrides = {}) => ({
  authentication: {
    accessToken: 'google-access-token',
    idToken: 'google-id-token-123',
  },
  user: {
    email: 'test@example.com',
    name: 'Test User',
    photo: 'https://example.com/photo.jpg',
  },
  ...overrides,
});

/**
 * Creates a no session response (user not logged in).
 *
 * @returns A response indicating no active session
 *
 * @example
 * supabase.auth.getSession.mockResolvedValue(mockNoSession());
 */
export const mockNoSession = () => ({
  data: { session: null },
  error: null,
});

/**
 * Creates a successful session refresh response.
 *
 * @param session - The refreshed session
 * @returns A successful refresh response
 *
 * @example
 * supabase.auth.refreshSession.mockResolvedValue(
 *   mockRefreshSuccess(createMockSession())
 * );
 */
export const mockRefreshSuccess = (session: Session) => ({
  data: { session, user: session.user },
  error: null,
});

/**
 * Creates a refresh token error response.
 *
 * @returns A refresh error response
 *
 * @example
 * supabase.auth.refreshSession.mockResolvedValue(mockRefreshError());
 */
export const mockRefreshError = () =>
  mockAuthError('Refresh token is invalid', 'INVALID_REFRESH_TOKEN');
