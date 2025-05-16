import React, { useState, useCallback, useMemo } from 'react';
import { router } from 'expo-router';
import { StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert} from 'react-native';
import { useAuthStore } from '@/src/features/auth/store';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/src/theme/ThemeProvider';
import { getInputStyles, getButtonStyles } from '@/src/theme/styles';
import { useTripStore } from '@/src/store/useTripStore';
import { Theme } from '@/src/theme/ThemeProvider';

interface EmailLoginFormProps {
  onClose: () => void; // Callback to close the modal or navigate back
}

export default function EmailLoginForm({ onClose }: EmailLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);
  const { login, loading, isVerifying } = useAuthStore();
  const { theme } = useTheme();
  const { checkPendingInvitations } = useTripStore.getState();

  // Memoize styles to prevent recalculation on every keystroke
  const inputStyles = useMemo(() => getInputStyles(theme), [theme]);
  const buttonStyles = useMemo(() => getButtonStyles(theme, loading), [theme, loading]);
  const componentStyles = useMemo(() => styles(theme), [theme]);

  // Memoize input state getters to avoid recalculating on every render
  const getEmailInputStyle = useMemo(() => [
    inputStyles.text,
    inputStyles.states[focusedInput === 'email' ? 'focus' : 'idle'].text
  ], [inputStyles, focusedInput]);

  const getPasswordInputStyle = useMemo(() => [
    inputStyles.text,
    inputStyles.states[focusedInput === 'password' ? 'focus' : 'idle'].text
  ], [inputStyles, focusedInput]);

  const getEmailContainerStyle = useMemo(() => [
    componentStyles.inputWrapper,
    inputStyles.states[focusedInput === 'email' ? 'focus' : 'idle'].container
  ], [componentStyles.inputWrapper, inputStyles.states, focusedInput]);

  const getPasswordContainerStyle = useMemo(() => [
    componentStyles.inputWrapper,
    inputStyles.states[focusedInput === 'password' ? 'focus' : 'idle'].container
  ], [componentStyles.inputWrapper, inputStyles.states, focusedInput]);

  // Memoize the button style calculation
  const loginButtonStyle = useMemo(() => [
    buttonStyles.container,
    componentStyles.loginButton,
    (!email.trim() || !password.trim()) && componentStyles.buttonDisabled,
  ], [buttonStyles.container, componentStyles.loginButton, componentStyles.buttonDisabled, email, password]);

  // Memoize input handlers to prevent recreating on every render
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
  }, []);

  const handleEmailFocus = useCallback(() => {
    setFocusedInput('email');
  }, []);

  const handlePasswordFocus = useCallback(() => {
    setFocusedInput('password');
  }, []);

  const handleInputBlur = useCallback(() => {
    setFocusedInput(null);
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      await login({ email, password });
      const { error } = useAuthStore.getState();
      
      if (error === 'email_not_verified') {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in. Check your inbox for the verification link."
        );
        return;
      }
      
      if (error === 'unregistered_user') {
        router.replace('/(auth)/register');
        return;
      }
      
      if (!error) {
        await checkPendingInvitations();
        onClose();
      }
    } catch (err) {
      // Login failed
    }
  }, [email, password, login, isVerifying, checkPendingInvitations, onClose]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={componentStyles.container}
    >
      <ThemedView style={componentStyles.content}>
        <ThemedText style={componentStyles.title}>Sign In with Email</ThemedText>

        {/* Email Input */}
        <ThemedView style={getEmailContainerStyle}>
          <ThemedText>Email</ThemedText>
          <TextInput
            style={getEmailInputStyle}
            placeholder="Enter your email"
            placeholderTextColor={theme.colors.content.tertiary}
            value={email}
            onChangeText={handleEmailChange}
            onFocus={handleEmailFocus}
            onBlur={handleInputBlur}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </ThemedView>

        {/* Password Input */}
        <ThemedView style={getPasswordContainerStyle}>
          <ThemedText>Password</ThemedText>
          <TextInput
            style={getPasswordInputStyle}
            placeholder="Enter your password"
            placeholderTextColor={theme.colors.content.tertiary}
            value={password}
            onChangeText={handlePasswordChange}
            onFocus={handlePasswordFocus}
            onBlur={handleInputBlur}
            secureTextEntry
            autoComplete="password"
          />
        </ThemedView>

        {/* Login Button */}
        <Pressable
          style={loginButtonStyle}
          onPress={handleLogin}
          disabled={loading || !email.trim() || !password.trim()}
        >
          <ThemedText style={buttonStyles.text}>
            {loading ? 'Signing in...' : 'Sign In'}
          </ThemedText>
        </Pressable>

        {/* Close Button */}
        <Pressable style={componentStyles.closeButton} onPress={onClose}>
          <ThemedText style={componentStyles.closeText}>Cancel</ThemedText>
        </Pressable>
      </ThemedView>
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
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.inset.md,
    },
    title: {
      ...theme.typography.heading.h2,
      textAlign: 'center',
      color: theme.colors.content.primary,
      marginBottom: theme.spacing.stack.lg,
    },
    inputWrapper: {
      marginBottom: theme.spacing.stack.md,
    },
    loginButton: {
      marginTop: theme.spacing.stack.lg,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    closeButton: {
      marginTop: theme.spacing.stack.md,
      alignItems: 'center',
    },
    closeText: {
      color: theme.colors.primary.main,
    },
  });
