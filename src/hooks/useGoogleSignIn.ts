import { useAuthStore } from '@/src/features/auth/store';
import { useState, useCallback } from 'react';
import Constants from 'expo-constants';
import { supabase } from '@/src/features/auth/service';
import * as SecureStore from 'expo-secure-store';
import { logger } from '@/src/utils/logger';

// Define interfaces for the Google Sign-In module
interface GoogleSigninStatusCodes {
  SIGN_IN_CANCELLED: string;
  IN_PROGRESS: string;
  PLAY_SERVICES_NOT_AVAILABLE: string;
  [key: string]: string;
}

interface GoogleUser {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  familyName: string | null;
  givenName: string | null;
}

interface GoogleSigninResponse {
  idToken: string | null;
  user: GoogleUser;
  data?: {
    idToken: string | null;
    user: GoogleUser;
  };
}

interface GoogleSigninTokens {
  accessToken: string;
  idToken: string;
}

interface GoogleSigninModule {
  configure: (config: GoogleSigninConfig) => void;
  hasPlayServices: (options: { showPlayServicesUpdateDialog: boolean }) => Promise<boolean>;
  signIn: () => Promise<GoogleSigninResponse>;
  getTokens: () => Promise<GoogleSigninTokens>;
  isSignedIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

interface GoogleSigninConfig {
  webClientId?: string;
  iosClientId?: string;
  scopes: string[];
}

interface GoogleSigninError extends Error {
  code: string;
  message: string;
}

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Only import GoogleSignin if not in Expo Go
let GoogleSignin: GoogleSigninModule;
let statusCodes: GoogleSigninStatusCodes;

if (!isExpoGo) {
  // Dynamic import to avoid the error in Expo Go
  const GoogleSignInModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = GoogleSignInModule.GoogleSignin;
  statusCodes = GoogleSignInModule.statusCodes;

  // Configure Google Sign-In immediately after import
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  if (webClientId) {
    const config: GoogleSigninConfig = {
      iosClientId,
      webClientId,
      scopes: ['openid', 'email', 'profile'],
    };

    GoogleSignin.configure(config);
  } else {
    console.error('Google Web Client ID is not defined in environment variables');
  }
}

const ACCESS_TOKEN_KEY = 'supabase_access_token'; // Ensure this matches the store's key

export function useGoogleSignIn() {
  const { handleGoogleSignInSuccess } = useAuthStore.getState(); // Use getState for actions outside components
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      logger.debug('AUTH', 'Google sign-in completed');

      // Support both possible return shapes
      const idToken = userInfo.idToken || userInfo.data?.idToken;
      if (!idToken) {
        throw new Error('Google Sign-In did not return an ID token.');
      }

      // --- SUPABASE AUTH ---
      const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      logger.debug('AUTH', 'Supabase ID token exchange completed');

      if (supabaseError) {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        throw new Error(`Supabase signInWithIdToken error: ${supabaseError.message}`);
      }

      if (!data.session) {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        throw new Error('Supabase did not return a session after Google sign-in.');
      }

      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.session.access_token);
      await handleGoogleSignInSuccess(data.session);
      setIsLoading(false);
      return data.session;
    } catch (err: any) {
      logger.error('AUTH', 'Google or Supabase sign-in failed:', err.message, err.code);
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      setError(err.message || 'An error occurred during Google Sign-In.');
      useAuthStore.setState({
        user: null,
        token: null,
        status: 'unauthenticated',
        loading: false,
        error: err.message,
      });
      setIsLoading(false);
      return undefined;
    }
  }, [handleGoogleSignInSuccess]);

  return { signIn, isLoading, error };
}
