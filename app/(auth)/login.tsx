import React, { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, Modal, Image } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useGoogleSignIn } from '@/src/hooks/useGoogleSignIn';
import { useAppleSignIn } from '@/src/hooks/useAppleSignIn';
import EmailLoginForm from '@/components/ui/auth/EmailLoginForm';
import { AuthOptionButton } from '@/components/ui/auth/AuthOptionButton';
import { Theme } from '@/src/theme/types';
import { Divider } from 'react-native-paper';

console.log('[LoginScreen] Rendering');

export default function LoginScreen() {
  const [isEmailModalVisible, setEmailModalVisible] = useState(false);
  const { theme } = useAppTheme();
  const { signIn: handleGoogleSignIn } = useGoogleSignIn();
  const { signIn: handleAppleSignIn } = useAppleSignIn();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles(theme).container}
    >
      <ThemedView style={styles(theme).content}>
        {/* Top Section for Welcome Message */}
        <ThemedView style={styles(theme).topSection}>
          <ThemedText style={styles(theme).title}>Welcome!</ThemedText>
          <ThemedText style={styles(theme).subtitle}>
            We're excited to have you on board! Please choose an option below to sign in.
          </ThemedText>
        </ThemedView>
        <Image
          source={require('@/assets/images/login-hero.png')}
          style={styles(theme).image}
          resizeMode="contain"
        />
        {/* Bottom Section for Auth Buttons */}
        <ThemedView style={styles(theme).bottomSection}>
          <AuthOptionButton
            provider="google"
            label="Continue with Google"
            onPress={handleGoogleSignIn}
          />

          {Platform.OS === 'ios' && (
            <React.Fragment>
              <Divider />
              <AuthOptionButton
                provider="apple"
                label="Continue with Apple"
                onPress={handleAppleSignIn}
              />
            </React.Fragment>
          )}

          <Divider />
          <AuthOptionButton
            provider="email"
            label="Continue with Email"
            onPress={() => setEmailModalVisible(true)}
          />
        </ThemedView>
      </ThemedView>

      {/* Email Login Modal */}
      <Modal
        animationType="slide"
        visible={isEmailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <EmailLoginForm onClose={() => setEmailModalVisible(false)} />
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
    content: {
      flex: 1,
      maxWidth: 450,
      alignSelf: 'center',
      width: '100%',
      justifyContent: 'space-between',
    },
    topSection: {
      // flex: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.inset.md,
      paddingTop: theme.spacing.inset.xl,
      marginBottom: theme.spacing.inset.md,
      marginTop: theme.spacing.inset.xl,
    },
    image: {
      flex: 1,
      width: '100%',
      height: undefined,
      paddingBottom: theme.spacing.inset.xl,
      marginBottom: theme.spacing.inset.xl,
    },
    bottomSection: {
      justifyContent: 'flex-end',
    },
    title: {
      ...theme.typography.heading.h1,
      textAlign: 'left',
      color: theme.colors.content.primary,
      marginBottom: theme.spacing.inset.sm,
    },
    subtitle: {
      ...theme.typography.body.medium,
      textAlign: 'left',
      color: theme.colors.content.primary,
      marginBottom: theme.spacing.inset.sm,
    },
    form: {
      gap: theme.spacing.stack.md,
    },
    inputWrapper: {
      gap: theme.spacing.inline.sm,
    },
    forgotPasswordContainer: {
      alignItems: 'flex-end',
    },
    signUpContainer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.inset.sm,
    },
    linkText: {
      ...theme.typography.button.medium,
      color: theme.colors.primary.main,
      fontWeight: theme.typography.button.medium.fontWeight,
    },
    loginButton: {
      marginTop: theme.spacing.inset.sm,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    errorContainer: {
      backgroundColor: theme.colors.status.error.surface,
      padding: theme.spacing.inset.md,
      borderRadius: theme.spacing.inset.sm,
      marginBottom: theme.spacing.inset.md,
    },
    errorText: {
      ...theme.typography.body.small,
      color: theme.colors.status.error.content,
      textAlign: 'center',
    },
  });
