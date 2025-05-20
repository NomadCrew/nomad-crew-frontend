import React, { useState } from 'react';
import { TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/src/features/auth/store';
import { onboardUser } from '@/src/api/api-client';
import { router } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';

const PUNS = [
  "Let's make it official! Pick a username your crew will remember.",
  "Your username is your passport to adventure ✈️.",
  "No more 'user1234'—let's get creative!",
  "This is your NomadCrew nickname. Make it fun!",
  "What should we call you on your next trip?",
  "Claim your travel alias!",
  "Your username, your vibe.",
  "Give us a name. We promise not to judge. Probably.",
  "The crew needs to know who to blame for getting lost.",
  "Your identity on this trip. Choose wisely (or not).",
  "No pressure, but this name might end up on a group T-shirt.",
  "Be the legend. Start with the name.",
  "This isn't just a username. It's your call sign.",
  "You're one username away from becoming the group's meme.",
  "Make it epic. Or weird. We support both.",
  "Think Bond. But like... budget-travel Bond.",
  "Pick a name. The campfire stories start here.",
  "Avoid names you used on Facebook. Trust us.",
  "Type a name. Feel powerful. Become unstoppable.",
];

function getRandomPun() {
  return PUNS[Math.floor(Math.random() * PUNS.length)];
}

export default function UsernameStep() {
  const { user, setUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username || user?.email?.split('@')[0] || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pun] = useState(getRandomPun());
  const { theme } = useAppTheme();

  const handleSubmit = async () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Optionally: check username availability via API here
      const updatedUser = await onboardUser(username.trim());
      if (setUser) setUser(updatedUser);
      router.replace('/(auth)/login');
    } catch (e) {
      setError('Failed to set username. Please try another.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView fullScreen style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <ThemedText variant="heading.h1" style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>
        👋 Welcome, Nomad!
      </ThemedText>
      <ThemedText variant="body.large" color="content.secondary" style={{ marginBottom: 20, textAlign: 'center', fontSize: 18 }}>
        {pun}
      </ThemedText>
      <ThemedView style={[styles.card, { backgroundColor: theme.colors.surface.default, borderRadius: theme.borderRadius.lg, shadowColor: theme.colors.primary.main }]}> 
        <ThemedText variant="body.medium" style={{ marginBottom: 8, textAlign: 'center', fontWeight: '600' }}>
          Choose your username
        </ThemedText>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          autoCapitalize="none"
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
          <ThemedText color="error.main" style={styles.error}>{error}</ThemedText>
        ) : null}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: theme.colors.primary.main,
              opacity: loading || pressed ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.primary.text} />
          ) : (
            <ThemedText color="primary.text" style={styles.buttonText}>Continue</ThemedText>
          )}
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
}); 