import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import type { UserProfile, LocationPrivacyLevel, UpdatePreferencesPayload } from './types';

/**
 * Fetch the current user's profile from the backend.
 */
export async function fetchUserProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>(API_PATHS.users.me);
  return response.data;
}

/**
 * Update the user's location privacy preference.
 * @param userId - The user ID
 * @param level - The new location privacy level ('hidden' | 'approximate' | 'precise')
 */
export async function updateLocationPrivacy(
  userId: string,
  level: LocationPrivacyLevel
): Promise<UserProfile> {
  const response = await api.put<UserProfile>(API_PATHS.users.byId(userId), {
    locationPrivacyPreference: level,
  });
  return response.data;
}

/**
 * Update user preferences (ghost mode, notifications, etc.) using merge semantics.
 * @param userId - The user ID
 * @param preferences - The preferences to update (merged with existing)
 */
export async function updateUserPreferences(
  userId: string,
  preferences: UpdatePreferencesPayload
): Promise<UserProfile> {
  // Uses merge-based preferences endpoint
  const response = await api.put<UserProfile>(
    `${API_PATHS.users.byId(userId)}/preferences`,
    preferences
  );
  return response.data;
}
