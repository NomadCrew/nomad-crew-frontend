import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureUnlimitedStore } from './secure-unlimited-store'; // Will be kept in the same directory

// Supabase Client Initialization
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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

// Secure Token Manager Logic (from secure-token-manager.ts)
// This uses secureUnlimitedStore for low-level encrypted storage.
// Supabase handles its own session persistence via AsyncStorage as configured above.
// This manager could be for other app-specific tokens if needed, or if we need more direct control
// over Supabase tokens outside of its default persistence.
// For now, let's assume Supabase's own session management is primary for auth tokens.
// This secureTokenManager can be used for other sensitive data if required by the auth feature.

class SecureTokenManager {
  private secureStore = secureUnlimitedStore; // from ./secure-unlimited-store.ts

  public async setItem(key: string, value: string): Promise<void> {
    return this.secureStore.setItem(key, value);
  }

  public async getItem(key: string): Promise<string | null> {
    return this.secureStore.getItem(key);
  }

  public async removeItem(key: string): Promise<void> {
    return this.secureStore.removeItem(key);
  }
}

export const secureTokenManager = new SecureTokenManager();

// AuthService class or collection of functions
// This will be expanded with login, logout, signUp, etc.
// These methods would typically interact with the `supabase` client.

// Example (to be expanded based on existing useAuthStore logic):
// export const signInWithEmail = async (email, password) => { ... supabase.auth.signInWithPassword ... }
// export const signOut = async () => { ... supabase.auth.signOut ... }

// For now, service.ts exports the initialized supabase client and the token manager.
// Actual auth functions (login, signup) will be added by migrating logic from useAuthStore. 