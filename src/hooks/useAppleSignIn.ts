import { appleAuth } from '@invertase/react-native-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from '@/src/auth/supabaseClient';
import { useAuthStore } from '@/src/store/useAuthStore';

export function useAppleSignIn() {
  const { handleAppleSignInSuccess } = useAuthStore();

  const signIn = async () => {
    try {
      // Ensure platform is iOS
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign In is only available on iOS devices');
      }

      // Request credentials
      const appleAuthResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // Get id token
      const { identityToken } = appleAuthResponse;
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