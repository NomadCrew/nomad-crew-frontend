/**
 * Hook for setting up trip permissions
 *
 * This hook automatically sets up the CASL ability context when a user
 * enters a trip view. It should be used in trip-related screens.
 */

import { useEffect, useMemo } from 'react';
import { useTripAbility } from './AbilityContext';
import type { MemberRole, TripContext } from './types';
import { useAuthStore } from '@/src/features/auth/store';
import type { Trip } from '@/src/features/trips/types';

interface UseTripPermissionsOptions {
  trip: Trip | null | undefined;
}

interface UseTripPermissionsResult {
  /** The user's role in this trip */
  userRole: MemberRole | null;
  /** Whether the user is the trip owner */
  isOwner: boolean;
  /** Whether the user is admin or owner */
  isAdminOrOwner: boolean;
  /** Whether the user is any kind of member */
  isMember: boolean;
  /** Check if user can perform an action */
  can: (action: string, subject: string) => boolean;
}

/**
 * Hook that sets up the permission context for a trip.
 * Call this in your trip detail screens to enable permission checking.
 *
 * @example
 * ```tsx
 * function TripDetailScreen({ trip }: { trip: Trip }) {
 *   const { isOwner, isAdminOrOwner, can } = useTripPermissions({ trip });
 *
 *   return (
 *     <View>
 *       {can('delete', 'Trip') && <DeleteTripButton />}
 *       {can('create', 'Invitation') && <InviteButton />}
 *     </View>
 *   );
 * }
 * ```
 */
export function useTripPermissions({ trip }: UseTripPermissionsOptions): UseTripPermissionsResult {
  const { setTripContext, clearContext, ability } = useTripAbility();
  const userId = useAuthStore((state) => state.user?.id);

  // Find the user's role in this trip
  const userRole = useMemo((): MemberRole | null => {
    if (!trip || !userId) return null;

    // Check if user is the creator (owner)
    if (trip.createdBy === userId) {
      return 'owner';
    }

    // Check members array for role
    const member = trip.members?.find((m) => m.userId === userId);
    if (member) {
      return member.role as MemberRole;
    }

    // User is not a member
    return null;
  }, [trip, userId]);

  // Set up the trip context when the trip or user changes
  useEffect(() => {
    if (trip && userId && userRole) {
      const context: TripContext = {
        tripId: trip.id,
        userId: userId,
        userRole: userRole,
      };
      setTripContext(context);
    } else {
      clearContext();
    }

    // Clear context when unmounting
    return () => {
      clearContext();
    };
  }, [trip?.id, userId, userRole, setTripContext, clearContext]);

  // Memoized permission checks
  const isOwner = userRole === 'owner';
  const isAdminOrOwner = userRole === 'owner' || userRole === 'admin';
  const isMember = userRole !== null;

  // Generic can function that uses the ability
  const can = (action: string, subject: string): boolean => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ability.can(action as any, subject as any);
  };

  return {
    userRole,
    isOwner,
    isAdminOrOwner,
    isMember,
    can,
  };
}

/**
 * Determine whether the current authenticated user is the creator of a resource.
 *
 * @param resourceCreatorId - The resource creator's user id to compare against.
 * @returns `true` if the current authenticated user's id equals `resourceCreatorId`, `false` otherwise.
 */
export function useIsResourceOwner(resourceCreatorId: string | undefined): boolean {
  const userId = useAuthStore((state) => state.user?.id);
  return Boolean(userId && resourceCreatorId && userId === resourceCreatorId);
}