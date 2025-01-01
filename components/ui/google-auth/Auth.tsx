import { useAuthStore } from '@/src/store/useAuthStore';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import type { GoogleSignInResponse } from '@/src/types/auth';

export async function handleGoogleSignIn(onSignInSuccess: (response: GoogleSignInResponse) => Promise<void>) {
  try {
    await GoogleSignin.hasPlayServices();
    const signInResult = await GoogleSignin.signIn();
    
    // Transform to our expected response type
    const response: GoogleSignInResponse = {
      data: {
        idToken: signInResult.idToken ?? '',
        scopes: signInResult.scopes,
        user: {
          email: signInResult.user.email,
          familyName: signInResult.user.familyName ?? '',
          givenName: signInResult.user.givenName ?? '',
          id: signInResult.user.id,
          name: signInResult.user.name ?? '',
          photo: signInResult.user.photo ?? undefined
        }
      },
      type: 'success'
    };

    await onSignInSuccess(response);
  } catch (error: any) {
    console.error('Google Sign-In Error:', {
      code: error.code,
      message: error.message,
    });

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('User cancelled sign-in');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('Sign-in already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.error('Play services not available');
    } else {
      throw error;
    }
  }
}