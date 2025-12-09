/**
 * CASL Ability Factory
 *
 * Defines permission rules that mirror the backend permission matrix:
 * - nomad-crew-backend/types/permission_matrix.go
 *
 * Permission Matrix:
 * | Resource    | Action          | OWNER | ADMIN | MEMBER |
 * |-------------|-----------------|-------|-------|--------|
 * | Trip        | read            | Yes   | Yes   | Yes    |
 * | Trip        | update          | Yes   | Yes   | No     |
 * | Trip        | delete          | Yes   | No    | No     |
 * | Member      | read            | Yes   | Yes   | Yes    |
 * | Member      | add             | Yes   | No    | No     |
 * | Member      | remove          | Yes   | No    | No     |
 * | Member      | change_role     | Yes   | Yes   | No     |
 * | Member      | leave           | Yes   | Yes   | Yes    |
 * | Invitation  | create          | Yes   | Yes   | No     |
 * | Invitation  | read            | Yes   | Yes   | No     |
 * | Invitation  | delete          | Yes   | Yes   | No     |
 * | Todo        | create          | Yes   | Yes   | Yes    |
 * | Todo        | read            | Yes   | Yes   | Yes    |
 * | Todo        | update (own)    | Yes   | Yes   | Yes    |
 * | Todo        | update (others) | Yes   | Yes   | No     |
 * | Todo        | delete (own)    | Yes   | Yes   | Yes    |
 * | Todo        | delete (others) | Yes   | Yes   | No     |
 * | Chat        | create          | Yes   | Yes   | Yes    |
 * | Chat        | read            | Yes   | Yes   | Yes    |
 * | Chat        | update (own)    | Yes   | Yes   | Yes    |
 * | Chat        | delete (own)    | Yes   | Yes   | Yes    |
 * | Chat        | delete (others) | Yes   | Yes   | No     |
 * | Location    | create (own)    | Yes   | Yes   | Yes    |
 * | Location    | read            | Yes   | Yes   | Yes    |
 * | Location    | update (own)    | Yes   | Yes   | Yes    |
 * | Expense     | create          | Yes   | Yes   | Yes    |
 * | Expense     | read            | Yes   | Yes   | Yes    |
 * | Expense     | update (own)    | Yes   | Yes   | Yes    |
 * | Expense     | update (others) | Yes   | Yes   | No     |
 * | Expense     | delete (own)    | Yes   | Yes   | Yes    |
 * | Expense     | delete (others) | Yes   | Yes   | No     |
 */

import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  ExtractSubjectType,
} from '@casl/ability';
import type { Action, AppSubjects, MemberRole, TripContext, Resource } from './types';

// Helper function to detect subject type from objects with __typename
function detectSubjectType(subject: AppSubjects): ExtractSubjectType<AppSubjects> {
  if (typeof subject === 'string') {
    return subject as Resource;
  }
  if (subject && typeof subject === 'object' && '__typename' in subject) {
    return subject.__typename as Resource;
  }
  // Fallback for unknown objects
  return 'all';
}

// Define the AppAbility type
export type AppAbility = MongoAbility<[Action, AppSubjects]>;

/**
 * Creates a CASL ability instance for a given trip context.
 * This should be called when the user enters a trip to set up their permissions.
 *
 * @param context - The trip context containing user ID and their role in the trip
 * @returns A CASL Ability instance with the appropriate permissions
 */
export function defineAbilityFor(context: TripContext | null): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (!context) {
    // No context = no permissions (except public actions)
    return build({ detectSubjectType });
  }

  const { userId, userRole } = context;

  // All members can read everything
  can('read', 'Trip');
  can('read', 'Member');
  can('read', 'Todo');
  can('read', 'Chat');
  can('read', 'Location');
  can('read', 'Expense');

  // All members can leave a trip
  can('leave', 'Member');

  // All members can create todos, chat messages, and expenses
  can('create', 'Todo');
  can('create', 'Chat');
  can('create', 'Expense');

  // All members can manage their own resources
  can('update', 'Todo', { createdBy: userId });
  can('delete', 'Todo', { createdBy: userId });
  can('update', 'Chat', { userId: userId });
  can('delete', 'Chat', { userId: userId });
  can('create', 'Location', { userId: userId });
  can('update', 'Location', { userId: userId });
  can('update', 'Expense', { createdBy: userId });
  can('delete', 'Expense', { createdBy: userId });

  // Admin-level permissions
  if (userRole === 'admin' || userRole === 'owner') {
    // Can update trip details
    can('update', 'Trip');

    // Can manage invitations
    can('create', 'Invitation');
    can('read', 'Invitation');
    can('delete', 'Invitation');

    // Can change member roles (except OWNER)
    can('change_role', 'Member');

    // Can manage other users' todos (update/delete)
    can('update', 'Todo');
    can('delete', 'Todo');

    // Can delete other users' chat messages
    can('delete', 'Chat');

    // Can manage other users' expenses
    can('update', 'Expense');
    can('delete', 'Expense');
  }

  // Owner-only permissions
  if (userRole === 'owner') {
    // Only owner can delete the trip
    can('delete', 'Trip');

    // Only owner can add/remove members directly
    can('invite', 'Member');
    can('remove', 'Member');

    // Owner has full management rights
    can('manage', 'all');
  }

  return build({ detectSubjectType });
}

/**
 * Creates an empty ability for unauthenticated users or non-members.
 * Use this as the default ability state.
 */
export function createEmptyAbility(): AppAbility {
  return createMongoAbility<[Action, AppSubjects]>([], { detectSubjectType });
}

/**
 * Helper to check if a role has at least the specified minimum role level.
 *
 * @param currentRole - The user's current role
 * @param minimumRole - The minimum required role
 * @returns true if the current role meets or exceeds the minimum
 */
export function hasMinimumRole(currentRole: MemberRole, minimumRole: MemberRole): boolean {
  const roleOrder: MemberRole[] = ['member', 'admin', 'owner'];
  return roleOrder.indexOf(currentRole) >= roleOrder.indexOf(minimumRole);
}

/**
 * Get the display name for a role.
 */
export function getRoleDisplayName(role: MemberRole): string {
  const displayNames: Record<MemberRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
  };
  return displayNames[role] || 'Unknown';
}
