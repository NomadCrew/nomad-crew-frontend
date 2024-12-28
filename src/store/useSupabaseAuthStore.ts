import { create } from 'zustand';
import { supabase } from '@/src/auth/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';

interface SupabaseAuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  registerWithEmailPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useSupabaseAuthStore = create<SupabaseAuthState>((set, get) => {
  // Set up auth state listener
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      set({ user: session.user, error: null });
      router.replace('/(tabs)');
    } else if (event === 'SIGNED_OUT') {
      set({ user: null });
      router.replace('/login');
    }
  });

  return {
    user: null,
    loading: false,
    error: null,
    isInitialized: false,

    setUser: (user) => set({ user }),

    initialize: async () => {
      console.log('[SupabaseAuthStore] Initializing');
      if (get().loading) return;

      set({ loading: true, error: null });
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error retrieving session:', error.message);
        }

        set({
          user: session?.user || null,
          isInitialized: true,
          loading: false,
          error: null,
        });
        
        console.log('[SupabaseAuthStore] Session found:', !!session?.user);
      } catch (err: any) {
        console.error('Initialization error:', err);
        set({
          user: null,
          isInitialized: true,
          loading: false,
          error: err.message || 'Failed to initialize session',
        });
      }
    },

    loginWithEmailPassword: async (email: string, password: string) => {
      set({ loading: true, error: null });
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Auth state listener will handle navigation and state update
        set({ loading: false, error: null });
      } catch (err: any) {
        set({
          loading: false,
          error: err.message || 'Login failed',
        });
      }
    },

    loginWithGoogle: async () => {
      set({ loading: true, error: null });
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
        });
        if (error) throw error;
        
        set({ loading: false });
      } catch (err: any) {
        set({
          loading: false,
          error: err.message || 'Google sign-in failed',
        });
      }
    },

    registerWithEmailPassword: async (email: string, password: string) => {
      set({ loading: true, error: null });
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        set({ loading: false, error: null });
        
        if (!data.session) {
          // Show confirmation message if email verification is required
          set({ error: 'Please check your email for confirmation link' });
        }
      } catch (err: any) {
        set({
          loading: false,
          error: err.message || 'Registration failed',
        });
      }
    },

    logout: async () => {
      set({ loading: true, error: null });
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Auth state listener will handle navigation and state update
        set({ loading: false });
      } catch (err: any) {
        set({
          loading: false,
          error: err.message || 'Logout failed',
        });
      }
    },
  };
});