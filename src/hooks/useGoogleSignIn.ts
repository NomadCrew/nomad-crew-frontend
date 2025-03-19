import { Platform } from 'react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useState } from 'react';
import Constants from 'expo-constants';
import { supabase } from '@/src/auth/supabaseClient';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Only import GoogleSignin if not in Expo Go
let GoogleSignin: any;
let statusCodes: any;

if (!isExpoGo) {
  // Dynamic import to avoid the error in Expo Go
  const GoogleSignInModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = GoogleSignInModule.GoogleSignin;
  statusCodes = GoogleSignInModule.statusCodes;

  // Configure Google Sign-In immediately after import
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = '369652278516-ug3bt8lt2b3pdq6vpuovhlgivaoquvp5.apps.googleusercontent.com';
  
  if (webClientId) {
    const config = {
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
        const googleSignInResponse = {
          user: userInfo.user,
          authentication: {
            accessToken,
            idToken
          }
        };
        await handleGoogleSignInSuccess(googleSignInResponse);
      }
      
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Sign in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available');
      } else {
        console.error('Google Sign-In error:', error);
      }
    }
  };

  return signIn;
}
