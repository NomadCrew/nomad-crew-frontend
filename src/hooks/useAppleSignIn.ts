import { Platform } from 'react-native';
import { supabase } from '@/src/features/auth/service';
import { useAuthStore } from '@/src/features/auth/store';
import Constants from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState, useEffect } from 'react';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

export function useAppleSignIn() {
  const { handleAppleSignInSuccess } = useAuthStore();
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

  // Check if Apple Authentication is available on this device
  useEffect(() => {
    const checkAvailability = async () => {
      if (Platform.OS === 'ios') {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        setIsAppleAuthAvailable(isAvailable);
      }
    };
    
    checkAvailability();
  }, []);

  const signIn = async () => {
    try {
      // Ensure platform is iOS
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign In is only available on iOS devices');
      }

      // Check if Apple Authentication is available
      if (!isAppleAuthAvailable) {
        throw new Error('Apple Sign In is not available on this device');
      }

      // Show a message in Expo Go
      if (isExpoGo) {
        console.log('Apple Sign-In may have limited functionality in Expo Go. For best results, use a development build.');
        // We'll still try to authenticate in Expo Go, as it might work
      }

      // Request credentials using Expo's Apple Authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Get identity token
      const { identityToken } = credential;
      if (!identityToken) {
        throw new Error('No identity token returned from Apple Sign In');
      }

      // Sign in with Supabase using the Apple token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
      });

      if (error) throw error;
      if (!data.session) throw new Error('No session returned from Apple sign-in');

      // Handle successful sign in
      await handleAppleSignInSuccess(data.session);

      return data;
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    }
  };

  return signIn;
}