import React from 'react';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingCarousel } from '@/components/onboarding/OnboardingCarousel';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { ONBOARDING_SLIDES } from '@/src/constants/onboarding';

export default function WelcomeScreen() {
  const { setFirstTimeDone } = useOnboarding();

  const handleComplete = async () => {
    try {
      console.log('[OnboardingWelcomeScreen] Completing onboarding');
      await setFirstTimeDone();
      console.log('[OnboardingWelcomeScreen] Navigating to login screen');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('[OnboardingWelcomeScreen] Error completing onboarding:', error);
    }
  };

  console.log('[OnboardingWelcomeScreen] Rendering content');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        <OnboardingCarousel slides={ONBOARDING_SLIDES} onComplete={handleComplete} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentWrapper: {
    flex: 1,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
});
