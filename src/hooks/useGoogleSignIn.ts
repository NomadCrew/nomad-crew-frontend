import { Platform } from 'react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useState } from 'react';
import Constants from 'expo-constants';
import { supabase } from '@/src/auth/supabaseClient';
import { GoogleSignInResponse } from '@/src/types/auth';

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
      scopes: ['openid', 'email', 'profile']
    };
    
    GoogleSignin.configure(config);
  } else {
    console.error('Google Web Client ID is not defined in environment variables');
  }
}

export function useGoogleSignIn() {
  const { handleGoogleSignInSuccess } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(!isExpoGo);

  // Sign-In Logic
  const signIn = async () => {
    if (isExpoGo) {
      alert('Google Sign-In is not available in Expo Go. Please use a development build.');
      return;
    }

    try {
      if (!isInitialized) {
        console.warn('Google Sign-In is not initialized yet');
        return;
      }
      
      // Check if Play Services are available (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      
      // Get the ID token
      const { accessToken, idToken } = await GoogleSignin.getTokens();
      
      // Sign in with Supabase using the Google token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken
      });
      
      if (error) throw error;
      
      if (data.session) {
        // Convert Supabase session to expected format
        const googleSignInResponse: GoogleSignInResponse = {
          user: {
            email: userInfo.user.email,
            name: userInfo.user.name,
            photo: userInfo.user.photo || undefined
          },
          authentication: {
            accessToken,
            idToken
          }
        };
        await handleGoogleSignInSuccess(googleSignInResponse);
      }
      
    } catch (error: unknown) {
      const googleError = error as GoogleSigninError;
      if (googleError.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Sign in cancelled');
      } else if (googleError.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in in progress');
      } else if (googleError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available');
      } else {
        console.error('Google Sign-In error:', error);
      }
    }
  };

  return signIn;
}
