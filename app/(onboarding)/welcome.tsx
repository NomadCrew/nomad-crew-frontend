import React from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
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
        <OnboardingCarousel 
          slides={ONBOARDING_SLIDES} 
          onComplete={handleComplete}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    marginTop: 32,
    marginBottom: 12,
  }
});