/**
 * Utility functions for user-related operations
 */

import { User } from '@supabase/supabase-js';

/**
 * Get a display name for a user based on available information
 * Attempts to extract from: user_metadata.full_name, user_metadata.name,
 * raw_user_meta_data.full_name, raw_user_meta_data.name, or email
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
