import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/src/utils/logger';

// Supabase Client Initialization
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

logger.debug('AUTH SERVICE', 'Supabase configuration loaded', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for Auth Service');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: AsyncStorage, // Using AsyncStorage for Supabase session persistence
  },
});

// AuthService class or collection of functions
// This will be expanded with login, logout, signUp, etc.
// These methods would typically interact with the `supabase` client.

export const refreshSupabaseSession = async () => {
  return supabase.auth.refreshSession();
};

/**
 * Registers the given push token for the currently authenticated user.
 * This sends the Expo push token to our backend for storage.
 */
export const registerPushTokenService = async (pushToken: string) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { api } = require('@/src/api/api-client');
  const { API_PATHS } = require('@/src/utils/api-paths');
  const { Platform } = require('react-native');

  const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';

  return api.post(API_PATHS.pushTokens.register, {
    token: pushToken,
    deviceType,
  });
};

/**
 * Deregisters the given push token from the backend (e.g., on logout).
 */
export const deregisterPushTokenService = async (pushToken: string) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { api } = require('@/src/api/api-client');
  const { API_PATHS } = require('@/src/utils/api-paths');

  return api.delete(API_PATHS.pushTokens.deregister, {
    data: { token: pushToken },
  });
};

// Example (to be expanded based on existing useAuthStore logic):
// export const signInWithEmail = async (email, password) => { ... supabase.auth.signInWithPassword ... }
// export const signOut = async () => { ... supabase.auth.signOut ... }

// For now, service.ts exports the initialized supabase client.
// Actual auth functions (login, signup) will be added by migrating logic from useAuthStore.
