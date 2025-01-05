import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View, Button } from 'react-native';
import Animated from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Props {
  slides: Array<{ id: string; title: string; subtitle: string; image: any }>;
  onComplete?: () => void;
}

export function OnboardingCarousel({ slides, onComplete }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const flatListRef = useRef<Animated.FlatList<{ id: string; title: string; subtitle: string; image: any }>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, slides.length, onComplete]);

  const renderSlide = useCallback(
    ({ item }: { item: { title: string; subtitle: string; image: any } }) => (
      <ThemedView style={[styles.slide, { width: screenWidth }]}>
        <Animated.Image source={item.image} style={styles.image} resizeMode="contain" />
        <ThemedText style={styles.title}>{item.title}</ThemedText>
        <ThemedText style={styles.subtitle}>{item.subtitle}</ThemedText>
      </ThemedView>
    ),
    [screenWidth]
  );

  return (
    <ThemedView style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false} // Disable swipe gestures
        showsHorizontalScrollIndicator={false}
        bounces={false}
      />
      <View style={styles.footer}>
        <Button
          title={currentIndex === slides.length - 1 ? 'Finish' : 'Next'}
          onPress={handleNext}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: '80%',
    height: '50%',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
