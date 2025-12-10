/**
 * Creates a mock trip invitation object for testing.
 *
 * @param overrides - Partial invitation properties to override defaults
 * @returns A trip invitation object
 *
 * @example
 * // Create a pending invitation
 * const invitation = createMockInvitation();
 *
 * @example
 * // Create an expired invitation
 * const expiredInvitation = createMockInvitation({
 *   status: 'expired',
 *   expiresAt: new Date(Date.now() - 86400000).toISOString()
 * });
 */
export const createMockInvitation = (overrides: Partial<{
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  token: string;
  expiresAt: string;
}> = {}) => ({
  email: 'invitee@example.com',
  status: 'pending' as const,
  token: 'inv-token-123',
  expiresAt: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
  ...overrides,
});

/**
 * Creates a mock accepted invitation.
 *
 * @param overrides - Partial invitation properties to override defaults
 * @returns An accepted invitation object
 *
 * @example
 * const acceptedInvitation = createMockAcceptedInvitation();
 */
export const createMockAcceptedInvitation = (overrides = {}) =>
  createMockInvitation({
    status: 'accepted',
    ...overrides,
  });

/**
 * Creates a mock expired invitation.
 *
 * @param overrides - Partial invitation properties to override defaults
 * @returns An expired invitation object
 *
 * @example
 * const expiredInvitation = createMockExpiredInvitation();
 */
export const createMockExpiredInvitation = (overrides = {}) =>
  createMockInvitation({
    status: 'expired',
    expiresAt: new Date(Date.now() - 86400000).toISOString(), // expired yesterday
    ...overrides,
  });
