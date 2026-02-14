/**
 * Permission Types for RBAC System
 *
 * Mirrors the backend permission types defined in:
 * - nomad-crew-backend/types/permissions.go
 * - nomad-crew-backend/types/permission_matrix.go
 */

// Actions that can be performed on resources
export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'invite'
  | 'remove'
  | 'change_role'
  | 'leave'
  | 'manage'; // 'manage' is a CASL wildcard for all actions

// Resources in the system
export type Resource =
  | 'Trip'
  | 'Member'
  | 'Invitation'
  | 'Chat'
  | 'Todo'
  | 'Expense'
  | 'Location'
  | 'Poll'
  | 'all'; // 'all' is a CASL wildcard for all resources

// Member roles matching backend types/membership.go
export type MemberRole = 'owner' | 'admin' | 'member';

// Role hierarchy values (higher = more permissions)
export const ROLE_HIERARCHY: Record<MemberRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

// Subject types for CASL
export interface TripSubject {
  __typename: 'Trip';
  id: string;
  createdBy: string;
}

export interface MemberSubject {
  __typename: 'Member';
  id: string;
  tripId: string;
  userId: string;
  role: MemberRole;
}

export interface InvitationSubject {
  __typename: 'Invitation';
  id: string;
  tripId: string;
}

export interface TodoSubject {
  __typename: 'Todo';
  id: string;
  tripId: string;
  createdBy: string;
}

export interface ChatSubject {
  __typename: 'Chat';
  id: string;
  tripId: string;
  userId: string;
}

export interface ExpenseSubject {
  __typename: 'Expense';
  id: string;
  tripId: string;
  createdBy: string;
}

export interface LocationSubject {
  __typename: 'Location';
  id: string;
  tripId: string;
  userId: string;
}

export interface PollSubject {
  __typename: 'Poll';
  id: string;
  tripId: string;
  createdBy: string;
}

// Union of all subjects for CASL type inference
export type AppSubjects =
  | TripSubject
  | MemberSubject
  | InvitationSubject
  | TodoSubject
  | ChatSubject
  | ExpenseSubject
  | LocationSubject
  | PollSubject
  | Resource;

// User context for ability definition
export interface AbilityUser {
  id: string;
  tripRole?: MemberRole;
}

// Trip context for permission checking
export interface TripContext {
  tripId: string;
  userRole: MemberRole;
  userId: string;
}
