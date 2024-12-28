import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/src/store/useAuthStore';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/src/theme/ThemeProvider';
import { getInputStyles, getButtonStyles } from '@/src/theme/styles';
import AuthButton from '@/components/ui/google-auth/Auth';

const getFriendlyErrorMessage = (error: string) => {
  const errorMap: Record<string, string> = {
    'auth/invalid-email': 'Please check your email and try again',
    'auth/wrong-password': 'Unable to sign in. Please check your details and try again',
    'auth/user-not-found': 'Unable to sign in. Please check your details and try again',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'network-error': 'Connection issues. Please check your internet and try again',
  };
  return errorMap[error] || 'Something went wrong. Please try again';
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(
    null
  );
  const { login, loading, error } = useAuthStore();
  const { theme } = useTheme();

  const inputStyles = getInputStyles(theme); // Shared input styles
  const buttonStyles = getButtonStyles(theme, loading); // Shared button styles

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }
    try {
      await login({ email, password });
    } catch (err) {
      // Error is handled by the store
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles(theme).container}
    >
      <ThemedView style={styles(theme).content}>
        {/* Header Section */}
        <ThemedView style={styles(theme).header}>
          <ThemedText style={styles(theme).title}>Welcome Back</ThemedText>
          <ThemedText style={styles(theme).subtitle}>
            Sign in to continue your journey
          </ThemedText>
        </ThemedView>

        {/* Error Message */}
        {error && (
          <ThemedView style={styles(theme).errorContainer}>
            <ThemedText style={styles(theme).errorText}>
              {getFriendlyErrorMessage(error)}
            </ThemedText>
          </ThemedView>
        )}

        {/* Form Section */}
        <ThemedView style={styles(theme).form}>
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

          {/* Forgot Password Link */}
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable style={styles(theme).forgotPasswordContainer}>
              <ThemedText style={styles(theme).linkText}>
                Forgot your password?
              </ThemedText>
            </Pressable>
          </Link>

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
            {loading ? (
              <ThemedView style={buttonStyles.loadingContainer}>
                <Loader2 size={20} color={theme.colors.primary.onPrimary} />
                <ThemedText style={buttonStyles.text}>Signing in...</ThemedText>
              </ThemedView>
            ) : (
              <ThemedText style={buttonStyles.text}>Sign In</ThemedText>
            )}
          </Pressable>
          <ThemedView  style={styles(theme).googleButtonContainer}>
            <AuthButton />
          </ThemedView>

          {/* Sign Up Link */}
          <Link href="/(auth)/register" asChild>
            <Pressable style={styles(theme).signUpContainer}>
              <ThemedText>
                Don't have an account?{' '}
                <ThemedText style={styles(theme).linkText}>Sign up</ThemedText>
              </ThemedText>
            </Pressable>
          </Link>
        </ThemedView>
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
      paddingHorizontal: theme.spacing.layout.screen.padding,
      justifyContent: 'center',
      maxWidth: 450,
      alignSelf: 'center',
      width: '100%',
    },
    header: {
      marginBottom: theme.spacing.layout.section.gap,
      gap: theme.spacing.stack.sm,
    },
    title: {
      ...theme.typography.heading.h1,
      textAlign: 'center',
      color: theme.colors.content.primary,
      marginBottom: theme.spacing.inset.sm,
    },
    subtitle: {
      ...theme.typography.body.medium,
      textAlign: 'center',
      color: theme.colors.content.secondary,
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
    googleButtonContainer: {
      marginVertical: theme.spacing.inset.md,
      alignItems: 'center',
    },
  });
