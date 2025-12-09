import React, { useState } from 'react';
import { TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/src/features/auth/store';
import { router } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { TravelVanAnimation } from '@/src/components/TravelVanAnimation';

const PUNS = [
  'Help your crew find you! Share an email they can use to invite you.',
  'Your secret identity needs a public side! Add a contact email.',
  'Even nomads need mail. Well, email at least.',
  "Friends can't invite you to trips without a way to reach you!",
  'Time to come out of hiding (a little). Add your email.',
  'Your Apple privacy shield is strong. Give friends a way in!',
  'Privacy is great, but your crew needs to find you somehow.',
  'The crew is calling! Add an email so they can reach you.',
  "Apple kept your email secret. Let's give friends a hint.",
  'One email to rule them all... or at least get trip invites.',
];

function getRandomPun() {
  return PUNS[Math.floor(Math.random() * PUNS.length)];
}

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

console.log('[ContactEmailStep] File loaded');

export default function ContactEmailStep() {
  console.log('[ContactEmailStep] Rendering');
  const user = useAuthStore((state) => state.user);
  // @ts-ignore - Type might not be fully updated
  const updateContactEmail = useAuthStore((state) => state.updateContactEmail);
  // @ts-ignore - Type might not be fully updated
  const setNeedsContactEmail = useAuthStore((state) => state.setNeedsContactEmail);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pun] = useState(getRandomPun());
  const { theme } = useAppTheme();

  const isValid = isValidEmail(email.trim());

  const handleSubmit = async () => {
    if (!email?.trim()) {
      setError('Email is required');
      return;
    }
    if (!isValid) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      console.log('Submitting contact email to backend:', email.trim());
      await updateContactEmail(email.trim());
      setNeedsContactEmail(false);
      // Navigate to main app
      router.replace('/(tabs)/trips');
    } catch (e: any) {
      if (e?.response?.data?.message?.toLowerCase().includes('email')) {
        setError('This email is already in use. Please try another.');
      } else {
        setError('Failed to save email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow skipping for now, but remind user later
    setNeedsContactEmail(false);
    router.replace('/(tabs)/trips');
  };

  return (
    <ThemedView fullScreen style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <ThemedText
        variant="heading.h1"
        style={{ fontSize: 28, marginBottom: 8, textAlign: 'center' }}
      >
        One More Thing!
      </ThemedText>
      <TravelVanAnimation />
      <ThemedText
        variant="body.large"
        color="content.secondary"
        style={{ marginBottom: 20, textAlign: 'center', fontSize: 16 }}
      >
        {pun}
      </ThemedText>
      <ThemedView
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface.default,
            borderRadius: theme.borderRadius.lg,
            shadowColor: theme.colors.primary.main,
          },
        ]}
      >
        <ThemedText
          variant="body.medium"
          style={{ marginBottom: 8, textAlign: 'center', fontWeight: '600' }}
        >
          Add a contact email
        </ThemedText>
        <ThemedText
          variant="body.small"
          color="content.tertiary"
          style={{ marginBottom: 12, textAlign: 'center' }}
        >
          This is separate from your Apple ID and helps friends find you.
        </ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          style={[
            styles.input,
            {
              borderColor: error ? theme.colors.error.main : theme.colors.primary.main,
              backgroundColor: theme.colors.background.surface,
              color: theme.colors.content.primary,
            },
          ]}
          editable={!loading}
          placeholderTextColor={theme.colors.content.tertiary}
        />
        {error ? (
          <ThemedText color="error.main" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: isValid ? theme.colors.primary.main : theme.colors.surface.variant,
              opacity: loading || pressed ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={loading || !isValid}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.primary.text} />
          ) : (
            <ThemedText
              color={isValid ? 'primary.text' : 'content.tertiary'}
              style={styles.buttonText}
            >
              Continue
            </ThemedText>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.skipButton, { opacity: pressed ? 0.5 : 1 }]}
          onPress={handleSkip}
          disabled={loading}
        >
          <ThemedText color="content.secondary" style={styles.skipText}>
            Skip for now
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    width: '100%',
    fontSize: 18,
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    marginTop: 4,
  },
  error: {
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 15,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  skipButton: {
    marginTop: 16,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
  },
});
