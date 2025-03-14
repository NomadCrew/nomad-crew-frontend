import { Platform } from 'react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useEffect, useState } from 'react';
import Constants from 'expo-constants';

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
    const configureGoogleSignIn = async () => {
      // Skip configuration in Expo Go
      if (isExpoGo) {
        console.log('Google Sign-In is not available in Expo Go');
        return;
      }

      try {
        const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
        
        if (!webClientId) {
          console.error('Google Web Client ID is not defined in environment variables');
          return;
        }
        
        const config = {
          scopes: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
          ],
          webClientId: webClientId,
          offlineAccess: true,
          iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        };
        
        // Add Android-specific configuration
        if (Platform.OS === 'android') {
          // You can add Android-specific configuration here if needed
        }
        
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
      
      // Sign in
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In successful:', userInfo);
      await handleGoogleSignInSuccess(userInfo);
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
