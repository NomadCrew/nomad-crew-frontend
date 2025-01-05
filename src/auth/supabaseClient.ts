import { createClient } from '@supabase/supabase-js';
import { secureTokenManager } from '@/src/auth/secure-token-manager';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
}

// Create Supabase client with custom storage logic
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
    storage: {
      getItem: async (key: string) => {
        console.log(`[Supabase] Retrieving key: ${key}`);
        return secureTokenManager.getItem(key);
      },
      setItem: async (key: string, value: string) => {
        console.log(`[Supabase] Storing key: ${key}, size: ${value.length} bytes`);
        return secureTokenManager.setItem(key, value);
      },
      removeItem: async (key: string) => {
        console.log(`[Supabase] Removing key: ${key}`);
        return secureTokenManager.removeItem(key);
      },
    },
  },
});

export default supabase;
