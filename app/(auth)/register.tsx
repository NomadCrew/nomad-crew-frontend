import { useState } from 'react';
import { StyleSheet, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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

  const buttonStyles = StyleSheet.flatten([styles.button, { backgroundColor: theme.colors.primary }]);
  console.log("Button Styles:", buttonStyles);
  console.log('Button Text Styles:', styles.buttonText);

  const linkStyles = StyleSheet.flatten(styles.link);  // Assuming styles.link contains all link styles
  console.log("Link Styles:", linkStyles);
  console.log('Link Container Styles:', styles.linkContainer);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Create Account
          </ThemedText>
          
          {error && (
            <ThemedText style={[styles.error, { color: theme.colors.error }]}>
              {error}
            </ThemedText>
          )}

          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.onSurface,
              borderColor: theme.colors.primary,
            }]}
            placeholder="Username"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={formData.username}
            onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.onSurface,
              borderColor: theme.colors.primary,
            }]}
            placeholder="Email"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.onSurface,
              borderColor: theme.colors.primary,
            }]}
            placeholder="Password"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            secureTextEntry
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.onSurface,
              borderColor: theme.colors.primary,
            }]}
            placeholder="First Name (Optional)"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={formData.firstName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.onSurface,
              borderColor: theme.colors.primary,
            }]}
            placeholder="Last Name (Optional)"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={formData.lastName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
          />

          <Pressable
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <ThemedText style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
                Register
              </ThemedText>
            )}
          </Pressable>

          <Link href="/login" asChild>
            <Pressable style={styles.linkContainer}>
              <ThemedText style={styles.link}>
                Already have an account? Sign in
              </ThemedText>
            </Pressable>
          </Link>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    flexDirection: "column", // Explicitly set
    alignItems: "stretch", // Ensure full width
  },
  title: {
    fontSize: 32,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  // error: {
    //   marginBottom: 16,
    //   textAlign: 'center',
    // },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 24,
      textAlign: "center", // Center text
    },
    link: {
      textDecorationLine: "underline",
      color: "black", // To ensure visibility
    },
    linkContainer: {
      alignItems: "center",
      marginTop: 16,
    },
});