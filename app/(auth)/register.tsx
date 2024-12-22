import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '@/src/store/useAuthStore';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [focusedInput, setFocusedInput] = useState<string | null>(null); // Track focused input
  const { register, loading, error } = useAuthStore();
  const { theme } = useTheme();

  const handleRegister = async () => {
    try {
      await register(formData);
      router.replace('/(tabs)');
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
              styles(theme).input,
              focusedInput === 'username'
                ? styles(theme).inputFocused
                : styles(theme).inputIdle,
            ]}
            placeholder="Username"
            placeholderTextColor={theme.colors.content.secondary}
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
              styles(theme).input,
              focusedInput === 'email'
                ? styles(theme).inputFocused
                : styles(theme).inputIdle,
            ]}
            placeholder="Email"
            placeholderTextColor={theme.colors.content.secondary}
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
              styles(theme).input,
              focusedInput === 'password'
                ? styles(theme).inputFocused
                : styles(theme).inputIdle,
            ]}
            placeholder="Password"
            placeholderTextColor={theme.colors.content.secondary}
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
              styles(theme).input,
              focusedInput === 'firstName'
                ? styles(theme).inputFocused
                : styles(theme).inputIdle,
            ]}
            placeholder="First Name (Optional)"
            placeholderTextColor={theme.colors.content.secondary}
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
              styles(theme).input,
              focusedInput === 'lastName'
                ? styles(theme).inputFocused
                : styles(theme).inputIdle,
            ]}
            placeholder="Last Name (Optional)"
            placeholderTextColor={theme.colors.content.secondary}
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
              <ActivityIndicator color={theme.colors.primary.onPrimary} />
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

const styles = (theme) =>
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
    input: {
      height: 48,
      borderWidth: 1,
      borderRadius: theme.spacing.inset.md,
      paddingHorizontal: theme.spacing.inset.md,
      marginBottom: theme.spacing.stack.md,
      fontSize: theme.typography.body.medium.fontSize,
    },
    inputFocused: {
      borderColor: theme.colors.primary.main,
    },
    inputIdle: {
      borderColor: theme.colors.border.default,
    },
    button: {
      height: 48,
      borderRadius: theme.spacing.inset.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.stack.sm,
    },
    buttonText: {
      ...theme.typography.button.medium,
      color: theme.colors.primary.onPrimary,
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
