export { UserAutocomplete } from './components/UserAutocomplete';

// User API functions
export { fetchUserProfile, updateLocationPrivacy, updateUserPreferences } from './api';

// User types
export type {
  LocationPrivacyLevel,
  UserPreferences,
  UserProfile,
  UpdateUserProfilePayload,
  UpdatePreferencesPayload,
} from './types';
