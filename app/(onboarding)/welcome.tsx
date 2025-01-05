import { StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { OnboardingCarousel } from '@/components/onboarding/OnboardingCarousel';
import { ThemedView } from '@/components/ThemedView';
import  { ONBOARDING_SLIDES } from '@/src/constants/onboarding';
import { useOnboarding } from '@/src/providers/OnboardingProvider';

export default function WelcomeScreen() {
  const { setFirstTimeDone } = useOnboarding();

  const handleComplete = async () => {
    try {
      console.log("Onboarding completed");
      await setFirstTimeDone();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <OnboardingCarousel slides={ONBOARDING_SLIDES} onComplete={handleComplete} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  skipContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    alignItems: 'center',
  },
  signInText: {
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  emailLink: {
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});