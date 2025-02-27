import React from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { OnboardingCarousel } from '@/components/onboarding/OnboardingCarousel';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { ONBOARDING_SLIDES } from '@/src/constants/onboarding';

export default function WelcomeScreen() {
  const { setFirstTimeDone } = useOnboarding();

  const handleComplete = async () => {
    try {
      await setFirstTimeDone();
      router.replace('/(auth)/login');
    } catch (error) {
      // Navigation error occurred
    }
  };

  return (
    <OnboardingCarousel 
      slides={ONBOARDING_SLIDES} 
      onComplete={handleComplete}
    />
  );
}

const styles = StyleSheet.create({});