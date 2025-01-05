import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Loader2, ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/src/theme/ThemeProvider';
import { getInputStyles, getButtonStyles } from '@/src/theme/styles';

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

export default function EmailLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);
  const { login, loading, error } = useAuthStore();
  const { theme } = useTheme();

  const inputStyles = getInputStyles(theme);
  const buttonStyles = getButtonStyles(theme, loading);

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
      style={styles.container}
    >
      <ThemedView style={styles.content}>
        {/* Back Button */}
        <Pressable 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.colors.content.primary} />
        </Pressable>

        {/* Header Section */}
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Sign in with email</ThemedText>
          <ThemedText style={styles.subtitle}>
            Enter your email and password to continue
          </ThemedText>
        </ThemedView>

        {/* Error Message */}
        {error && (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>
              {getFriendlyErrorMessage(error)}
            </ThemedText>
          </ThemedView>
        )}

        {/* Form Section */}
        <ThemedView style={styles.form}>
          <ThemedView style={styles.inputWrapper}>
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

          <ThemedView style={styles.inputWrapper}>
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

          <Pressable
            style={[
              buttonStyles.container,
              styles.loginButton,
              (!email.trim() || !password.trim()) && styles.buttonDisabled,
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
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
  },
  backButton: {
    marginTop: 12,
    padding: 8,
    marginLeft: -8,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    gap: 8,
  },
  loginButton: {
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
});