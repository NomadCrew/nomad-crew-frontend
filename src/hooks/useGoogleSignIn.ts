import { Platform } from 'react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useEffect, useState } from 'react';
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
}

export function useGoogleSignIn() {
  const { handleGoogleSignInSuccess } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Configure Google Sign-In
  useEffect(() => {
    console.log('Auth: ' + isExpoGo);
    const configureGoogleSignIn = async () => {
      // Skip configuration in Expo Go
      if (isExpoGo) {
        console.log('Google Sign-In is not available in Expo Go');
        return;
      }

      try {
        const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
        // Use the development client ID directly since we're in development mode
        const iosClientId = '369652278516-ug3bt8lt2b3pdq6vpuovhlgivaoquvp5.apps.googleusercontent.com';
        
        if (!webClientId) {
          console.error('Google Web Client ID is not defined in environment variables');
          return;
        }
        
        const config = {
          ...Platform.select({
            ios: {
              iosClientId: iosClientId,
            },
            android: {
              offlineAccess: true,
            }
          }),
          webClientId: webClientId,
          scopes: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
          ],
        };
        
        console.log('Configuring Google Sign-In with:', config);
        await GoogleSignin.configure(config);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error configuring Google Sign-In:', error);
      }
    };
    
    configureGoogleSignIn();
  }, []);

  // Sign-In Logic
  const signIn = async () => {
    // Show a message in Expo Go
    if (isExpoGo) {
      console.log('Google Sign-In is not available in Expo Go. Please use a development build.');
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
        const isPlayServicesAvailable = await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        
        if (!isPlayServicesAvailable) {
          console.error('Play Services are not available');
          return;
        }
      }
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In userInfo:', userInfo);
      
      // Get the ID token
      const { accessToken, idToken } = await GoogleSignin.getTokens();
      console.log('Google Sign-In tokens:', { accessToken, idToken });
      
      // Sign in with Supabase using the Google token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken, // Use idToken instead of accessToken
      });
      
      if (error) {
        console.error('Supabase sign in error:', error);
        throw error;
      }
      
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
      console.error('Google Sign-In error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Sign in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available');
      } else {
        console.error('Other sign in error:', error);
      }
    }
  };

  return signIn;
}
