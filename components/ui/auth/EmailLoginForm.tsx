import React, { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert} from 'react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/src/theme/ThemeProvider';
import { getInputStyles, getButtonStyles } from '@/src/theme/styles';

interface EmailLoginFormProps {
  onClose: () => void; // Callback to close the modal or navigate back
}

export default function EmailLoginForm({ onClose }: EmailLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);
  const { login, loading, isVerifying } = useAuthStore();
  const { theme } = useTheme();

  const inputStyles = getInputStyles(theme);
  const buttonStyles = getButtonStyles(theme, loading);

  const handleLogin = async () => {
    try {
      console.log('[EmailLogin] Attempting login');
      console.log('[EmailLogin] Starting login flow - current isVerifying:', isVerifying);
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
        onClose();
      }
    } catch (err) {
      console.error('[EmailLogin] Login failed:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles(theme).container}
    >
      <ThemedView style={styles(theme).content}>
        <ThemedText style={styles(theme).title}>Sign In with Email</ThemedText>

        {/* Email Input */}
        <ThemedView style={styles(theme).inputWrapper}>
          <ThemedText>Email</ThemedText>
          <TextInput
            style={[
              inputStyles.states[focusedInput === 'email' ? 'focus' : 'idle'],
              inputStyles.text,
            ]}
            placeholder="Enter your email"
            placeholderTextColor={theme.colors.content.tertiary}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </ThemedView>

        {/* Password Input */}
        <ThemedView style={styles(theme).inputWrapper}>
          <ThemedText>Password</ThemedText>
          <TextInput
            style={[
              inputStyles.states[focusedInput === 'password' ? 'focus' : 'idle'],
              inputStyles.text,
            ]}
            placeholder="Enter your password"
            placeholderTextColor={theme.colors.content.tertiary}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedInput('password')}
            onBlur={() => setFocusedInput(null)}
            secureTextEntry
            autoComplete="password"
          />
        </ThemedView>

        {/* Login Button */}
        <Pressable
          style={[
            buttonStyles.container,
            styles(theme).loginButton,
            (!email.trim() || !password.trim()) && styles(theme).buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading || !email.trim() || !password.trim()}
        >
          <ThemedText style={buttonStyles.text}>
            {loading ? 'Signing in...' : 'Sign In'}
          </ThemedText>
        </Pressable>

        {/* Close Button */}
        <Pressable style={styles(theme).closeButton} onPress={onClose}>
          <ThemedText style={styles(theme).closeText}>Cancel</ThemedText>
        </Pressable>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = (theme) =>
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
