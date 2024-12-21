import { useState } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Link } from 'expo-router';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/src/store/useAuthStore';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/src/theme/ThemeProvider';
import { getInputStyles, getButtonStyles } from '@/src/theme/styles';

const getFriendlyErrorMessage = (error: string) => {
  // Map technical errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'auth/invalid-email': 'Please check your email and try again',
    'auth/wrong-password': 'Unable to sign in. Please check your details and try again',
    'auth/user-not-found': 'Unable to sign in. Please check your details and try again',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'network-error': 'Connection issues. Please check your internet and try again',
  };
  
  // Default to a generic message if error not mapped
  return errorMap[error] || 'Something went wrong. Please try again';
};

export default function LoginScreen() {
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
        {/* Header Section */}
        <ThemedView style={styles.header}>
          <ThemedText 
            variant="heading.h1"
            style={styles.title}
          >
            Welcome Back
          </ThemedText>
          
          <ThemedText 
            variant="body.medium"
            style={styles.subtitle}
          >
            Sign in to continue your journey
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
          {/* Email Input */}
          <ThemedView style={styles.inputWrapper}>
            <ThemedText variant="input.label">
              Email
            </ThemedText>
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
          <ThemedView style={styles.inputWrapper}>
            <ThemedText variant="input.label">
              Password
            </ThemedText>
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
            <Pressable style={styles.forgotPasswordContainer}>
              <ThemedText 
                variant="body.small"
                style={styles.linkText}
              >
                Forgot your password?
              </ThemedText>
            </Pressable>
          </Link>

          {/* Login Button */}
          <Pressable
            style={[
              buttonStyles.container,
              styles.loginButton,
              (!email.trim() || !password.trim()) && styles.buttonDisabled
            ]}
            onPress={handleLogin}
            disabled={loading || !email.trim() || !password.trim()}
          >
            {loading ? (
              <ThemedView style={buttonStyles.loadingContainer}>
                <Loader2 
                  size={20} 
                  color={theme.colors.primary.text} 
                  className="animate-spin"
                />
                <ThemedText style={buttonStyles.text}>
                  Signing in...
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedText style={buttonStyles.text}>
                Sign In
              </ThemedText>
            )}
          </Pressable>

          {/* Sign Up Link */}
          <Link href="/(auth)/register" asChild>
            <Pressable style={styles.signUpContainer}>
              <ThemedText variant="body.medium">
                Don't have an account?{' '}
                <ThemedText 
                  variant="body.medium" 
                  style={styles.linkText}
                >
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
    maxWidth: 450,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 40,
    gap: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  form: {
    gap: 24,
  },
  inputWrapper: {
    gap: 8,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
  },
  signUpContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: 'orange.500',
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    backgroundColor: 'red.50',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorText: {
    color: 'red.700',
    textAlign: 'center',
  },
});