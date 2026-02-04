import { User } from '@/src/features/auth/types';

/**
 * Creates a mock User object for testing.
 *
 * @param overrides - Partial user properties to override defaults
 * @returns A complete User object with test data
 *
 * @example
 * // Create a basic user
 * const user = createMockUser();
 *
 * @example
 * // Create a user with custom properties
 * const customUser = createMockUser({
 *   email: 'custom@example.com',
 *   firstName: 'Custom',
 *   lastName: 'User'
 * });
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  profilePicture: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  appleUser: false,
  ...overrides,
});

/**
 * Creates a mock User object representing an Apple sign-in user.
 *
 * @param overrides - Partial user properties to override defaults
 * @returns A User object configured as an Apple user
 *
 * @example
 * const appleUser = createMockAppleUser();
 */
export const createMockAppleUser = (overrides: Partial<User> = {}): User => ({
  ...createMockUser({
    appleUser: true,
    email: 'appleid@privaterelay.appleid.com',
    username: 'appleuser',
  }),
  ...overrides,
});

/**
 * Creates a mock User object with minimal data (no optional fields).
 * Useful for testing edge cases where user data is incomplete.
 *
 * @param overrides - Partial user properties to override defaults
 * @returns A User object with only required fields
 *
 * @example
 * const minimalUser = createMockMinimalUser();
 */
export const createMockMinimalUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-minimal-123',
  email: 'minimal@example.com',
  username: 'minimaluser',
  ...overrides,
});
