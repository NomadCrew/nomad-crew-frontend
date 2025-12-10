/**
 * Permission System Exports
 *
 * This module provides RBAC (Role-Based Access Control) for the frontend,
 * mirroring the backend permission system.
 */

// Types
export type {
  Action,
  Resource,
  MemberRole,
  TripContext,
  AppSubjects,
  AbilityUser,
  TripSubject,
  MemberSubject,
  InvitationSubject,
  TodoSubject,
  ChatSubject,
  ExpenseSubject,
  LocationSubject,
} from './types';

export { ROLE_HIERARCHY } from './types';

// Ability factory and helpers
export type { AppAbility } from './ability';
export {
  defineAbilityFor,
  createEmptyAbility,
  hasMinimumRole,
  getRoleDisplayName,
} from './ability';

// Context and hooks
export {
  AbilityProvider,
  Can,
  useTripAbility,
  usePermission,
  useCurrentRole,
  useIsOwner,
  useIsAdminOrOwner,
} from './AbilityContext';

// Trip-specific permission hook
export { useTripPermissions, useIsResourceOwner } from './useTripPermissions';
