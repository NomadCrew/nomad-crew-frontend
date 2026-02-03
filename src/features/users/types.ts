export type LocationPrivacyLevel = 'hidden' | 'approximate' | 'precise';

export interface UserPreferences {
  notifications?: {
    push?: boolean;
    email?: boolean;
    tripUpdates?: boolean;
    chatMessages?: boolean;
  };
  ghostMode?: boolean;
  // extensible for future preferences
  [key: string]: unknown;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  createdAt: string;
  updatedAt?: string;
  locationPrivacyPreference: LocationPrivacyLevel;
  preferences?: UserPreferences;
}

export interface UpdateUserProfilePayload {
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface UpdatePreferencesPayload {
  ghostMode?: boolean;
  notifications?: Partial<UserPreferences['notifications']>;
}
