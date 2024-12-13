import { useState } from 'react';
import { StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '@/src/store/useAuthStore';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Loader2 } from 'lucide-react';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuthStore();
  const { theme } = useTheme();

  const handleLogin = async () => {
    try {
      await login(email, password);
      router.replace('/(tabs)');
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
        {/* Header Section */}
        <ThemedView style={styles.header}>
          <ThemedText style={[
            theme.typography.display.medium,
            { color: theme.colors.content.primary }
          ]}>
            Welcome Back
          </ThemedText>
          
          <ThemedText style={[
            theme.typography.body.medium,
            { color: theme.colors.content.secondary }
          ]}>
            Sign in to continue your journey
          </ThemedText>
        </ThemedView>

        {/* Error Message */}
        {error && (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={[
              theme.typography.body.small,
              { color: theme.colors.status.error.content }
            ]}>
              {error}
            </ThemedText>
          </ThemedView>
        )}

        {/* Form Section */}
        <ThemedView style={styles.form}>
          {/* Email Input */}
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={[
              theme.typography.input.label,
              { color: theme.colors.content.secondary }
            ]}>
              Email
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background.surface,
                  color: theme.colors.content.primary,
                  borderColor: theme.colors.border.default,
                  ...theme.typography.input.text,
                }
              ]}
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.content.tertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </ThemedView>

          {/* Password Input */}
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={[
              theme.typography.input.label,
              { color: theme.colors.content.secondary }
            ]}>
              Password
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background.surface,
                  color: theme.colors.content.primary,
                  borderColor: theme.colors.border.default,
                  ...theme.typography.input.text,
                }
              ]}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.content.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </ThemedView>

          {/* Forgot Password Link */}
          <Link href="/forgot-password" asChild>
            <Pressable style={styles.forgotPasswordContainer}>
              <ThemedText style={[
                theme.typography.body.small,
                { color: theme.colors.primary.main }
              ]}>
                Forgot your password?
              </ThemedText>
            </Pressable>
          </Link>

          {/* Login Button */}
          <Pressable
            style={[
              styles.button,
              { backgroundColor: theme.colors.primary.main },
              loading && { opacity: 0.7 },
              theme.elevation.button.rest,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <ThemedText style={[
              theme.typography.button.medium,
              { color: theme.colors.primary.text }
            ]}>
              {loading ? (
                <ThemedView style={styles.loadingContainer}>
                  <Loader2 className="animate-spin" size={20} />
                  <ThemedText>Signing in...</ThemedText>
                </ThemedView>
              ) : (
                'Sign In'
              )}
            </ThemedText>
          </Pressable>

          {/* Sign Up Link */}
          <Link href="/register" asChild>
            <Pressable style={styles.signUpContainer}>
              <ThemedText style={[
                theme.typography.body.medium,
                { color: theme.colors.content.secondary }
              ]}>
                Don't have an account?{' '}
                <ThemedText style={{ color: theme.colors.primary.main }}>
                  Sign up
                </ThemedText>
              </ThemedText>
            </Pressable>
          </Link>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    gap: 8,
  },
  errorContainer: {
    backgroundColor: theme => theme.colors.status.error.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
  },
  signUpContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});