import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '@/src/features/auth/store';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { getInputStyles } from '@/src/theme/styles';
import { Theme } from '@/src/theme/types';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { register, loading, error, isVerifying } = useAuthStore();
  const { theme } = useAppTheme();

  // Use shared input styles
  const inputStyles = getInputStyles(theme);

  const handleRegister = async () => {
    try {
      await register(formData);
      Alert.alert(
        "Registration Successful",
        "We've sent you a verification email. Please click the link in the email to verify and login again.",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate to login screen
              router.replace('/(auth)/login');
            }
          }
        ]
      );
    } catch (err) {
      // Error is handled by the store
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles(theme).container}
    >
      <ScrollView contentContainerStyle={styles(theme).scrollContent}>
        <ThemedView style={styles(theme).content}>
          <ThemedText style={styles(theme).title}>Create Account</ThemedText>

          {error && (
            <ThemedText style={styles(theme).errorText}>{error}</ThemedText>
          )}

          {/* Username Input */}
          <TextInput
            style={[
              inputStyles.states[focusedInput === 'username' ? 'focus' : 'idle'],
              inputStyles.text,
            ]}
            placeholder="Username"
            placeholderTextColor={theme.colors.content.tertiary}
            value={formData.username}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, username: text }))
            }
            onFocus={() => setFocusedInput('username')}
            onBlur={() => setFocusedInput(null)}
          />

          {/* Email Input */}
          <TextInput
            style={[
              inputStyles.states[focusedInput === 'email' ? 'focus' : 'idle'],
              inputStyles.text,
            ]}
            placeholder="Email"
            placeholderTextColor={theme.colors.content.tertiary}
            value={formData.email}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, email: text }))
            }
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
          />

          {/* Password Input */}
          <TextInput
            style={[
              inputStyles.states[focusedInput === 'password' ? 'focus' : 'idle'],
              inputStyles.text,
            ]}
            placeholder="Password"
            placeholderTextColor={theme.colors.content.tertiary}
            value={formData.password}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, password: text }))
            }
            secureTextEntry
            onFocus={() => setFocusedInput('password')}
            onBlur={() => setFocusedInput(null)}
          />

          {/* First Name Input */}
          <TextInput
            style={[
              inputStyles.states[focusedInput === 'firstName' ? 'focus' : 'idle'],
              inputStyles.text,
            ]}
            placeholder="First Name (Optional)"
            placeholderTextColor={theme.colors.content.tertiary}
            value={formData.firstName}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, firstName: text }))
            }
            onFocus={() => setFocusedInput('firstName')}
            onBlur={() => setFocusedInput(null)}
          />

          {/* Last Name Input */}
          <TextInput
            style={[
              inputStyles.states[focusedInput === 'lastName' ? 'focus' : 'idle'],
              inputStyles.text,
            ]}
            placeholder="Last Name (Optional)"
            placeholderTextColor={theme.colors.content.tertiary}
            value={formData.lastName}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, lastName: text }))
            }
            onFocus={() => setFocusedInput('lastName')}
            onBlur={() => setFocusedInput(null)}
          />

          {/* Register Button */}
          <Pressable
            style={[
              styles(theme).button,
              { backgroundColor: theme.colors.primary.main },
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles(theme).buttonText}>Register</ThemedText>
            )}
          </Pressable>

          {/* Already have an account? */}
          <Link href="/login" asChild>
            <Pressable style={styles(theme).linkContainer}>
              <ThemedText style={styles(theme).link}>
                Already have an account? Sign in
              </ThemedText>
            </Pressable>
          </Link>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      padding: theme.spacing.layout.screen.padding,
      justifyContent: 'center',
      flexDirection: 'column',
      alignItems: 'stretch',
    },
    title: {
      ...theme.typography.heading.h1,
      textAlign: 'center',
      marginBottom: theme.spacing.layout.section.gap,
      color: theme.colors.content.primary,
    },
    button: {
      height: 56,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.stack.sm,
    },
    buttonText: {
      ...theme.typography.button.medium,
      color: theme.colors.primary.text,
    },
    linkContainer: {
      alignItems: 'center',
      marginTop: theme.spacing.stack.md,
    },
    link: {
      ...theme.typography.body.medium,
      color: theme.colors.primary.main,
      textDecorationLine: 'underline',
    },
    errorText: {
      ...theme.typography.body.small,
      color: theme.colors.status.error.content,
      textAlign: 'center',
      marginBottom: theme.spacing.stack.md,
    },
  });
