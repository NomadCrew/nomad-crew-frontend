import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// ---
// Supabase configuration
// ---
// Prefer environment variables, fallback to hardcoded values for local/dev
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://efmqiltdajvqenndmylz.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE'; // Replace with real key or use env

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
  // eslint-disable-next-line no-console
  console.warn('[supabase] Missing or invalid Supabase URL or anon key. Check your environment variables.');
}

// ---
// Create a singleton Supabase client
// ---
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // For React Native
  },
});

/**
 * Usage:
 *   import { supabase } from '@/src/api/supabase';
 *   const { data, error } = await supabase.from('table').select('*');
 */ 