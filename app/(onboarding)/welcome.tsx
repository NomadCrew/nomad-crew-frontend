import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Onboarding from 'react-native-onboarding-swiper';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { ONBOARDING_SLIDES } from '@/src/constants/onboarding';

export default function WelcomeScreen() {
  const { setFirstTimeDone } = useOnboarding();

  const handleComplete = async () => {
    try {
      console.log('Onboarding completed');
      await setFirstTimeDone();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <Onboarding
      pages={ONBOARDING_SLIDES.map((slide) => ({
        backgroundColor: slide.backgroundColor,
        image: <Image source={slide.image} style={styles.image} resizeMode="contain" />,
        title: slide.title,
        subtitle: slide.subtitle,
      }))}
      onSkip={handleComplete}
      onDone={handleComplete}
      showNext={true}
      showSkip={true}
      nextLabel="Next"
      skipLabel="Skip"
      containerStyles={{ flex: 1 }}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '80%',
    height: '50%',
    marginBottom: 20,
  },
});
