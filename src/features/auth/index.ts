export { useAuthStore } from './store';
export type { User, AuthState, LoginCredentials, RegisterCredentials, AuthStatus, ApiError, GoogleSignInResponse } from './types';
export {
  supabase,
  secureTokenManager,
  getSupabaseSession,
  signUpWithEmailPassword,
  signInWithEmailPassword,
  signInWithGoogleIdToken,
  signOut,
  refreshSupabaseSession
} from './service';
// Add other exports like components, hooks as they are created/moved here 