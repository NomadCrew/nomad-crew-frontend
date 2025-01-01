import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/src/theme/ThemeProvider';
import { AuthOptionButton } from '@/components/ui/auth/AuthOptionButton';
import { useAuthStore } from '@/src/store/useAuthStore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useCallback } from 'react';
import type { GoogleSignInResponse } from '@/src/types/auth';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { handleGoogleSignInSuccess } = useAuthStore();

  const handleEmailSignIn = useCallback(() => {
    router.push('/(auth)/email');
  }, []);

  const handleGooglePress = useCallback(async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      console.log('Google Sign-In Result:', signInResult);
  
      if (signInResult && signInResult.data) {
        const { data } = signInResult;
        const response: GoogleSignInResponse = {
          data: {
            idToken: data.idToken || '',
            scopes: data.scopes || [],
            serverAuthCode: data.serverAuthCode || '',
            user: {
              email: data.user.email,
              familyName: data.user.familyName || '',
              givenName: data.user.givenName || '',
              id: data.user.id,
              name: data.user.name || '',
              photo: data.user.photo || undefined
            }
          },
          type: 'success'
        };
  
        await handleGoogleSignInSuccess(response);
      } else {
        throw new Error('Incomplete Google sign-in result');
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      const cancelResponse: GoogleSignInResponse = {
        data: {
          idToken: '',
          scopes: [],
          serverAuthCode: '',
          user: {
            email: '',
            familyName: '',
            givenName: '',
            id: '',
            name: '',
          }
        },
        type: 'cancel'
      };
      await handleGoogleSignInSuccess(cancelResponse);
    }
  }, [handleGoogleSignInSuccess]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={[
          styles.title,
          { color: theme.colors.content.primary }
        ]}>
          Welcome!
        </ThemedText>
        <ThemedText style={[
          styles.subtitle,
          { color: theme.colors.content.secondary }
        ]}>
          We're so glad you're here! Please choose an option below to sign in.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.optionsContainer}>
        <AuthOptionButton
          provider="google"
          label="Continue with Google"
          onPress={handleGooglePress}
        />
        <AuthOptionButton
          provider="email"
          label="Continue with email"
          onPress={handleEmailSignIn}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
});