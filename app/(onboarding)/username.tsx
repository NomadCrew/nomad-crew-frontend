import React, { useState } from 'react';
import { TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/src/features/auth/store';
import { onboardUser, getCurrentUserProfile } from '@/src/api/api-client';
import { router } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { TravelVanAnimation } from '@/src/components/TravelVanAnimation';

const PUNS = [
  "Let's make it official! Pick a username your crew will remember.",
  'Your username is your passport to adventure ✈️.',
  "No more 'user1234'—let's get creative!",
  'This is your NomadCrew nickname. Make it fun!',
  'What should we call you on your next trip?',
  'Claim your travel alias!',
  'Your username, your vibe.',
  'Give us a name. We promise not to judge. Probably.',
  'The crew needs to know who to blame for getting lost.',
  'Your identity on this trip. Choose wisely (or not).',
  'No pressure, but this name might end up on a group T-shirt.',
  'Be the legend. Start with the name.',
  "This isn't just a username. It's your call sign.",
  "You're one username away from becoming the group's meme.",
  'Make it epic. Or weird. We support both.',
  'Think Bond. But like... budget-travel Bond.',
  'Pick a name. The campfire stories start here.',
  'Avoid names you used on Facebook. Trust us.',
  'Type a name. Feel powerful. Become unstoppable.',
];

const usernames = [
  'xXx_SlayerBoi420_xXx',
  'password123',
  'toenail_collector',
  'notavirus.exe',
  '__underscore__king__',
  '69_cheeseburgerz_69',
  'i_luv_taxidermy',
  'ur_mom_dot_com',
  'flat_earth_daddy',
  'emotional_baggage69',
  'crustybagel',
  'C0d3r_B0y_2008',
  'grandmas_wrath',
  'twerky_turtle',
  'butter_fartz',
  'sadboi.vibes.only',
  'why_am_I_like_this',
  'uncle_touchy',
  'milkman_returns',
  'secretnachos',
];

function getRandomPun() {
  return PUNS[Math.floor(Math.random() * PUNS.length)];
}

function getRandomUsername() {
  return usernames[Math.floor(Math.random() * usernames.length)];
}

console.log('[UsernameStep] File loaded, starting UsernameStep component render');

export default function UsernameStep() {
  console.log('[UsernameStep] Inside UsernameStep function - rendering');
  const user = useAuthStore((state) => state.user);
  // @ts-ignore - Temporarily ignore for logging, AuthState type might be missing action signatures
  const setUser = useAuthStore((state) => state.setUser);
  // @ts-ignore - Temporarily ignore for logging, AuthState type might be missing action signatures
  const setNeedsUsername = useAuthStore((state) => state.setNeedsUsername);
  // @ts-ignore - Type might not be fully updated
  const needsContactEmail = useAuthStore((state) => state.needsContactEmail);
  // Prefer current username, then email prefix, then random
  const initialUsername = user?.username || user?.email?.split('@')[0] || getRandomUsername();
  const [username, setUsername] = useState(initialUsername);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pun] = useState(getRandomPun());
  const { theme } = useAppTheme();

  const isUnchanged = (username?.trim() ?? '') === (initialUsername?.trim() ?? '');

  const handleSubmit = async () => {
    if (!username?.trim()) {
      setError('Username is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Only send username to backend when user submits
      console.log('Submitting username to backend:', username.trim());
      await onboardUser(username.trim());
      // Fetch the updated user profile
      const updatedUser = await getCurrentUserProfile();
      console.log('Fetched backend user after setting username:', updatedUser);
      setUser(updatedUser);
      setNeedsUsername(false);
      // Navigate to contact-email screen if needed, otherwise go to main app
      if (needsContactEmail) {
        console.log('Username set, routing to contact-email screen');
        router.replace('/(onboarding)/contact-email');
      } else {
        router.replace('/(tabs)/trips');
      }
    } catch (e: any) {
      // If backend returns uniqueness error, show it
      if (e?.response?.data?.message?.toLowerCase().includes('username')) {
        setError('That username is taken. Please try another.');
      } else {
        setError('Failed to set username. Please try another.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView fullScreen style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <ThemedText
        variant="heading.h1"
        style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}
      >
        👋 Welcome, Nomad!
      </ThemedText>
      <TravelVanAnimation />
      <ThemedText
        variant="body.large"
        color="content.secondary"
        style={{ marginBottom: 20, textAlign: 'center', fontSize: 18 }}
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
          Choose your username
        </ThemedText>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder={initialUsername}
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
          <ThemedText color="error.main" style={styles.error}>
            {error}
          </ThemedText>
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
            <ThemedText color="primary.text" style={styles.buttonText}>
              {isUnchanged ? 'Keep this username' : 'Set username'}
            </ThemedText>
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
