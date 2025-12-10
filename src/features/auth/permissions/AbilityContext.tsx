/**
 * AbilityContext Provider for CASL
 *
 * Provides permission checking capabilities throughout the app.
 * Uses the @casl/react package for React integration.
 *
 * Usage:
 * 1. Wrap your app (or trip-specific routes) with <AbilityProvider>
 * 2. Use the useTripAbility() hook to get/set permissions
 * 3. Use <Can> component or ability.can() for permission checks
 *
 * Example:
 * ```tsx
 * const { ability, setTripContext } = useTripAbility();
 *
 * // When entering a trip:
 * setTripContext({ tripId: '123', userId: 'user1', userRole: 'admin' });
 *
 * // Permission check:
 * if (ability.can('delete', 'Trip')) { ... }
 *
 * // Or with Can component:
 * <Can I="delete" a="Trip">
 *   <DeleteButton />
 * </Can>
 * ```
 */

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { createContextualCan } from '@casl/react';
import { AppAbility, defineAbilityFor, createEmptyAbility } from './ability';
import type { TripContext, MemberRole } from './types';

// Create a separate context just for the Ability (required by createContextualCan)
const RawAbilityContext = createContext<AppAbility>(createEmptyAbility());

// Create the Can component bound to the ability context
export const Can = createContextualCan(RawAbilityContext.Consumer);

// Context value interface for our extended functionality
interface TripAbilityContextValue {
  ability: AppAbility;
  tripContext: TripContext | null;
  setTripContext: (context: TripContext | null) => void;
  updateRole: (newRole: MemberRole) => void;
  clearContext: () => void;
}

// Create the context for our extended functionality
const TripAbilityContext = createContext<TripAbilityContextValue | undefined>(undefined);

interface AbilityProviderProps {
  children: ReactNode;
}

/**
 * Provides CASL ability and trip-scoped helpers to its descendant components.
 *
 * Supplies both RawAbilityContext (for declarative `Can` checks) and TripAbilityContext
 * (which exposes `ability`, `tripContext`, `setTripContext`, `updateRole`, and `clearContext`)
 * and manages the ability lifecycle as `tripContext` changes.
 *
 * @returns A React element that provides the ability contexts to its children
 */
export function AbilityProvider({ children }: AbilityProviderProps) {
  const [tripContext, setTripContextState] = useState<TripContext | null>(null);

  // Memoize the ability based on the trip context
  const ability = useMemo(() => {
    return tripContext ? defineAbilityFor(tripContext) : createEmptyAbility();
  }, [tripContext]);

  // Set the trip context (when entering a trip)
  const setTripContext = useCallback((context: TripContext | null) => {
    setTripContextState(context);
  }, []);

  // Update just the role (for when role changes without leaving the trip)
  const updateRole = useCallback((newRole: MemberRole) => {
    setTripContextState((prev) => {
      if (!prev) return null;
      return { ...prev, userRole: newRole };
    });
  }, []);

  // Clear the context (when leaving a trip)
  const clearContext = useCallback(() => {
    setTripContextState(null);
  }, []);

  const value = useMemo(
    () => ({
      ability,
      tripContext,
      setTripContext,
      updateRole,
      clearContext,
    }),
    [ability, tripContext, setTripContext, updateRole, clearContext]
  );

  // Wrap with both contexts - RawAbilityContext for the Can component,
  // and TripAbilityContext for the extended functionality
  return (
    <RawAbilityContext.Provider value={ability}>
      <TripAbilityContext.Provider value={value}>{children}</TripAbilityContext.Provider>
    </RawAbilityContext.Provider>
  );
}

/**
 * Hook to access the trip ability context.
 *
 * @throws Error if used outside of AbilityProvider
 * @returns The ability context value
 */
export function useTripAbility(): TripAbilityContextValue {
  const context = useContext(TripAbilityContext);
  if (!context) {
    throw new Error('useTripAbility must be used within an AbilityProvider');
  }
  return context;
}

/**
 * Check whether the current ability permits an action on a subject.
 *
 * @param action - The action to test (for example, `'read'`, `'update'`, etc.)
 * @param subject - The subject or subject type to test the action against
 * @returns `true` if the ability permits `action` on `subject`, `false` otherwise
 */
export function usePermission(
  action: Parameters<AppAbility['can']>[0],
  subject: Parameters<AppAbility['can']>[1]
): boolean {
  const { ability } = useTripAbility();
  return ability.can(action, subject);
}

/**
 * Hook that returns the current user's role in the active trip.
 *
 * @returns The user's role or null if not in a trip context
 */
export function useCurrentRole(): MemberRole | null {
  const { tripContext } = useTripAbility();
  return tripContext?.userRole ?? null;
}

/**
 * Determine whether the current user's role within the active trip is `owner`.
 *
 * @returns `true` if the current user's role is `'owner'`, `false` otherwise.
 */
export function useIsOwner(): boolean {
  const role = useCurrentRole();
  return role === 'owner';
}

/**
 * Determines whether the current user's role is 'owner' or 'admin'.
 *
 * @returns `true` if the current role is 'owner' or 'admin', `false` otherwise.
 */
export function useIsAdminOrOwner(): boolean {
  const role = useCurrentRole();
  return role === 'owner' || role === 'admin';
}