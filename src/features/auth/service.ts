import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/src/utils/logger';

// Supabase Client Initialization
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

logger.debug('AUTH SERVICE', 'Supabase configuration loaded', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey
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
 */
export const registerPushTokenService = async (pushToken: string) => {
  // The `api` object here would be the global api client instance.
  // This assumes the api client is already configured with necessary base URL and auth headers.
  // We might need to import `api` from `@/src/api/api-client` here, or pass it as an argument
  // if we want to strictly avoid global imports in services, though often services do import the client.
  // For now, assuming `api` can be imported and used if it's appropriately set up.
  // If api client is not directly accessible, this function might need to be part of a class that gets api client injected.
  const { api } = await import('@/src/api/api-client'); // Dynamically importing to resolve if api client is set up
  return api.post('/users/push-token', { token: pushToken });
};

// Example (to be expanded based on existing useAuthStore logic):
// export const signInWithEmail = async (email, password) => { ... supabase.auth.signInWithPassword ... }
// export const signOut = async () => { ... supabase.auth.signOut ... }

// For now, service.ts exports the initialized supabase client.
// Actual auth functions (login, signup) will be added by migrating logic from useAuthStore.