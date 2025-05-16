import React, { useState } from 'react';
import { StyleSheet, View, Platform, useWindowDimensions, Image, TextStyle } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { OnboardingSlide } from '@/src/types/onboarding';

// Add declaration for the module
declare module 'react-native-onboarding-swiper' {}

interface Props {
  slides: OnboardingSlide[];
  onComplete?: () => void;
}

export function OnboardingCarousel({ slides, onComplete }: Props) {
  const [_currentIndex, _setCurrentIndex] = useState(0);
  const { theme } = useTheme();
  const { width: _screenWidth } = useWindowDimensions();

  // Components for the onboarding pages
  const Title = ({ title, titleStyles }: { title: string; titleStyles?: TextStyle }) => (
    <ThemedText 
      style={[styles.title, titleStyles]}
      variant="heading.h1"
    >
      {title}
    </ThemedText>
  );

  const Subtitle = ({ subtitle, subtitleStyles }: { subtitle: string; subtitleStyles?: TextStyle }) => (
    <ThemedText 
      style={[styles.subtitle, subtitleStyles]}
      variant="body.large"
    >
      {subtitle}
    </ThemedText>
  );

  const pages = slides.map(slide => ({
    backgroundColor: slide.backgroundColor,
    image: (
      <Animated.View entering={FadeIn.duration(120)}>
        <Image
          source={slide.image}
          style={[styles.image, slide.imageStyles]}
          resizeMode="contain"
        />
      </Animated.View>
    ),
    title: <Title title={slide.title} titleStyles={slide.titleStyles} />,
    subtitle: <Subtitle subtitle={slide.subtitle} subtitleStyles={slide.subtitleStyles} />,
  }));

  return (
    <View style={styles.container}>
      <Onboarding
        pages={pages}
        onDone={onComplete}
        containerStyles={styles.onboardingContainer}
        imageContainerStyles={styles.imageContainer}
        bottomBarColor="transparent"
        bottomBarHeight={80}
        transitionAnimationDuration={120}
        showSkip={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  onboardingContainer: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  imageContainer: {
    paddingBottom: 20,
  },
  image: {
    width: 280,
    height: 280,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
    paddingHorizontal: 40,
  },
  frostedGlass: {
    width: 120,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  iosFrostedGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  androidFrostedGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});