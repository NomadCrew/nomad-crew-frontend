import { Platform } from 'react-native';
import { supabase } from '@/src/features/auth/service';
import { useAuthStore } from '@/src/features/auth/store';
import Constants from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';
import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/src/utils/logger';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

const ACCESS_TOKEN_KEY = 'supabase_access_token';

export function useAppleSignIn() {
  const { handleAppleSignInSuccess } = useAuthStore.getState(); // Use getState for actions outside components
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const signIn = useCallback(async () => {
    if (!isAppleAuthAvailable) {
      setError('Apple Sign-In is not available on this device.');
      // Optionally, provide a more user-friendly alert here
      logger.warn('AUTH', 'Apple Sign-In not available.');
      return undefined;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Ensure platform is iOS
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign In is only available on iOS devices');
      }

      // Show a message in Expo Go
      if (isExpoGo) {
        console.log(
          'Apple Sign-In may have limited functionality in Expo Go. For best results, use a development build.'
        );
        // We'll still try to authenticate in Expo Go, as it might work
      }

      // Request credentials using Expo's Apple Authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        logger.debug('AUTH', 'Apple identityToken retrieved successfully.');
        // Sign in with Supabase using the Apple token
        const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (supabaseError) {
          await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY); // Clear on Supabase failure
          throw supabaseError;
        }

        if (data.session) {
          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.session.access_token);
          // Assuming handleAppleSignInSuccess in the store now takes a Supabase session
          await handleAppleSignInSuccess(data.session);
          setIsLoading(false);
          return data.session;
        } else {
          await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY); // Clear if no session from Supabase
          throw new Error('Apple sign-in with Supabase succeeded but no session was returned.');
        }
      } else {
        throw new Error('Apple Sign-In did not return an identity token.');
      }
    } catch (err: any) {
      logger.error('AUTH', 'Apple Sign-In or Supabase auth failed:', err.message, err.code);
      // Check if the error is a user cancellation
      if (err.code === 'ERR_APPLE_CANCELLED' || err.code === 'ERR_CANCELED') {
        // Expo Apple Auth uses ERR_CANCELED
        logger.info('AUTH', 'Apple Sign-In cancelled by user.');
        // Don't set a generic error message for user cancellation
      } else {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY); // Clear for other errors
        setError(err.message || 'An error occurred during Apple Sign-In.');
        useAuthStore.setState({
          user: null,
          token: null,
          status: 'unauthenticated',
          loading: false,
          error: err.message,
        });
      }
      setIsLoading(false);
      return undefined;
      // Do not re-throw, allow UI to react to isLoading/error
    }
  }, [isAppleAuthAvailable, handleAppleSignInSuccess]);

  return { signIn, isLoading, error, isAppleAuthAvailable };
}
