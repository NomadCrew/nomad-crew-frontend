/**
 * Backwards compatibility re-export
 *
 * The supabase client was moved from src/auth/supabaseClient.ts to src/api/supabase.ts
 * This file exists to maintain backwards compatibility with existing imports and test mocks.
 *
 * New code should import directly from '@/src/api/supabase'
 */
export { supabase } from '@/src/api/supabase';
