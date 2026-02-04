/**
 * Utility functions for user-related operations
 */

import { User } from '@supabase/supabase-js';

/**
 * Get a human-readable display name for a user from available profile data.
 *
 * @param user - The user object; if `null` or `undefined`, `'Unknown User'` is returned.
 * @returns The user's display name: the value of `user.user_metadata.full_name` or `user.user_metadata.name` when present; otherwise the local part of `user.email` (the portion before `@`) or `'Unknown User'` if that local part is empty; if neither name nor email is available, returns `'User X'` where `X` is the first four characters of `user.id` (or an empty string if `id` is missing).
 */
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return 'Unknown User';

  // Try to get name from user_metadata, then email
  const name = user.user_metadata?.full_name || user.user_metadata?.name;

  if (name) return name;

  if (user.email) {
    return user.email.split('@')[0] || 'Unknown User'; // Fallback to part of email
  }

  return `User ${user.id?.substring(0, 4) || ''}`; // Fallback to part of ID
}