/**
 * Tests for the CASL ability factory and permission system.
 *
 * These tests verify that:
 * 1. Permission rules are correctly applied for each role
 * 2. Resource-specific permissions work with conditions
 * 3. Role hierarchy is respected
 */

import {
  defineAbilityFor,
  createEmptyAbility,
  hasMinimumRole,
  getRoleDisplayName,
} from '../../src/features/auth/permissions/ability';
import type { TripContext, MemberRole } from '../../src/features/auth/permissions/types';

describe('Permission System - Ability Factory', () => {
  const testUserId = 'user-123';
  const otherUserId = 'user-456';
  const testTripId = 'trip-789';

  // Helper to create trip context
  const createContext = (role: MemberRole): TripContext => ({
    tripId: testTripId,
    userId: testUserId,
    userRole: role,
  });

  describe('createEmptyAbility', () => {
    it('should create an ability with no permissions', () => {
      const ability = createEmptyAbility();

      expect(ability.can('read', 'Trip')).toBe(false);
      expect(ability.can('create', 'Todo')).toBe(false);
      expect(ability.can('delete', 'Trip')).toBe(false);
    });
  });

  describe('defineAbilityFor - null context', () => {
    it('should return empty ability when context is null', () => {
      const ability = defineAbilityFor(null);

      expect(ability.can('read', 'Trip')).toBe(false);
      expect(ability.can('create', 'Todo')).toBe(false);
    });
  });

  describe('defineAbilityFor - Member role', () => {
    let ability: ReturnType<typeof defineAbilityFor>;

    beforeEach(() => {
      ability = defineAbilityFor(createContext('member'));
    });

    it('should allow reading all resources', () => {
      expect(ability.can('read', 'Trip')).toBe(true);
      expect(ability.can('read', 'Member')).toBe(true);
      expect(ability.can('read', 'Todo')).toBe(true);
      expect(ability.can('read', 'Chat')).toBe(true);
      expect(ability.can('read', 'Location')).toBe(true);
      expect(ability.can('read', 'Expense')).toBe(true);
    });

    it('should allow creating todos, chat, and expenses', () => {
      expect(ability.can('create', 'Todo')).toBe(true);
      expect(ability.can('create', 'Chat')).toBe(true);
      expect(ability.can('create', 'Expense')).toBe(true);
    });

    it('should allow leaving a trip', () => {
      expect(ability.can('leave', 'Member')).toBe(true);
    });

    it('should allow updating own todos', () => {
      const ownTodo = {
        __typename: 'Todo' as const,
        id: 'todo-1',
        tripId: testTripId,
        createdBy: testUserId,
      };
      const otherTodo = {
        __typename: 'Todo' as const,
        id: 'todo-2',
        tripId: testTripId,
        createdBy: otherUserId,
      };

      expect(ability.can('update', ownTodo)).toBe(true);
      expect(ability.can('delete', ownTodo)).toBe(true);
      expect(ability.can('update', otherTodo)).toBe(false);
      expect(ability.can('delete', otherTodo)).toBe(false);
    });

    it('should allow updating own chat messages', () => {
      const ownMessage = {
        __typename: 'Chat' as const,
        id: 'msg-1',
        tripId: testTripId,
        userId: testUserId,
      };
      const otherMessage = {
        __typename: 'Chat' as const,
        id: 'msg-2',
        tripId: testTripId,
        userId: otherUserId,
      };

      expect(ability.can('update', ownMessage)).toBe(true);
      expect(ability.can('delete', ownMessage)).toBe(true);
      expect(ability.can('update', otherMessage)).toBe(false);
      expect(ability.can('delete', otherMessage)).toBe(false);
    });

    it('should NOT allow trip management actions', () => {
      expect(ability.can('update', 'Trip')).toBe(false);
      expect(ability.can('delete', 'Trip')).toBe(false);
      expect(ability.can('create', 'Invitation')).toBe(false);
      expect(ability.can('change_role', 'Member')).toBe(false);
      expect(ability.can('remove', 'Member')).toBe(false);
    });
  });

  describe('defineAbilityFor - Admin role', () => {
    let ability: ReturnType<typeof defineAbilityFor>;

    beforeEach(() => {
      ability = defineAbilityFor(createContext('admin'));
    });

    it('should have all member permissions', () => {
      expect(ability.can('read', 'Trip')).toBe(true);
      expect(ability.can('create', 'Todo')).toBe(true);
      expect(ability.can('leave', 'Member')).toBe(true);
    });

    it('should allow updating trip details', () => {
      expect(ability.can('update', 'Trip')).toBe(true);
    });

    it('should allow managing invitations', () => {
      expect(ability.can('create', 'Invitation')).toBe(true);
      expect(ability.can('read', 'Invitation')).toBe(true);
      expect(ability.can('delete', 'Invitation')).toBe(true);
    });

    it('should allow changing member roles', () => {
      expect(ability.can('change_role', 'Member')).toBe(true);
    });

    it("should allow updating/deleting other users' todos", () => {
      const otherTodo = {
        __typename: 'Todo' as const,
        id: 'todo-2',
        tripId: testTripId,
        createdBy: otherUserId,
      };

      expect(ability.can('update', otherTodo)).toBe(true);
      expect(ability.can('delete', otherTodo)).toBe(true);
    });

    it("should allow deleting other users' chat messages", () => {
      const otherMessage = {
        __typename: 'Chat' as const,
        id: 'msg-2',
        tripId: testTripId,
        userId: otherUserId,
      };

      expect(ability.can('delete', otherMessage)).toBe(true);
    });

    it('should NOT allow owner-only actions', () => {
      expect(ability.can('delete', 'Trip')).toBe(false);
      expect(ability.can('remove', 'Member')).toBe(false);
    });
  });

  describe('defineAbilityFor - Owner role', () => {
    let ability: ReturnType<typeof defineAbilityFor>;

    beforeEach(() => {
      ability = defineAbilityFor(createContext('owner'));
    });

    it('should have all admin permissions', () => {
      expect(ability.can('update', 'Trip')).toBe(true);
      expect(ability.can('create', 'Invitation')).toBe(true);
      expect(ability.can('change_role', 'Member')).toBe(true);
    });

    it('should allow deleting the trip', () => {
      expect(ability.can('delete', 'Trip')).toBe(true);
    });

    it('should allow inviting and removing members', () => {
      expect(ability.can('invite', 'Member')).toBe(true);
      expect(ability.can('remove', 'Member')).toBe(true);
    });

    it('should have full management rights', () => {
      expect(ability.can('manage', 'all')).toBe(true);
    });
  });

  describe('hasMinimumRole', () => {
    it('should return true for equal roles', () => {
      expect(hasMinimumRole('member', 'member')).toBe(true);
      expect(hasMinimumRole('admin', 'admin')).toBe(true);
      expect(hasMinimumRole('owner', 'owner')).toBe(true);
    });

    it('should return true for higher roles', () => {
      expect(hasMinimumRole('admin', 'member')).toBe(true);
      expect(hasMinimumRole('owner', 'member')).toBe(true);
      expect(hasMinimumRole('owner', 'admin')).toBe(true);
    });

    it('should return false for lower roles', () => {
      expect(hasMinimumRole('member', 'admin')).toBe(false);
      expect(hasMinimumRole('member', 'owner')).toBe(false);
      expect(hasMinimumRole('admin', 'owner')).toBe(false);
    });
  });

  describe('getRoleDisplayName', () => {
    it('should return correct display names', () => {
      expect(getRoleDisplayName('owner')).toBe('Owner');
      expect(getRoleDisplayName('admin')).toBe('Admin');
      expect(getRoleDisplayName('member')).toBe('Member');
    });
  });
});
