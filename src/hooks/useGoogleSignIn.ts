import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useEffect } from 'react';

export function useGoogleSignIn() {
  const { handleGoogleSignInSuccess } = useAuthStore();

  // Configure Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  // Sign-In Logic
  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      await handleGoogleSignInSuccess(userInfo);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // Sign in cancelled
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign in in progress
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available
      }
    }
  };

  return signIn;
}
