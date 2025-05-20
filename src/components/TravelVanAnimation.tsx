import React, { useRef } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface TravelVanAnimationProps {
  size?: number;
  loop?: boolean;
  autoPlay?: boolean;
  style?: ViewStyle;
}

export function TravelVanAnimation({ 
  size = 220, 
  loop = true, 
  autoPlay = true, 
  style 
}: TravelVanAnimationProps) {
  const animationRef = useRef<LottieView>(null);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <LottieView
        ref={animationRef}
        source={require('@/assets/animations/travel-van.json')}
        style={{ width: size, height: size }}
        autoPlay={autoPlay}
        loop={loop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TravelVanAnimation; 