import React, { useState } from 'react';
import { View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useSharedValue } from 'react-native-reanimated';

interface CarouselItem {
  id: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

interface BentoCarouselProps {
  items: CarouselItem[];
  width: number;
  height: number;
  onProgressChange?: (offsetProgress: number) => void;
}

export const BentoCarousel = ({ items, width, height, onProgressChange }: BentoCarouselProps) => {
  const [_activeIndex, setActiveIndex] = useState(0);
  const _currentIndex = useSharedValue(0);

  const renderItem = React.useCallback(
    ({
      item,
      animationValue: _animationValue,
    }: {
      item: CarouselItem;
      index: number;
      animationValue: Animated.SharedValue<number>;
    }) => {
      const Component = item.component;

      return (
        <Animated.View style={{ width, height, overflow: 'hidden', borderRadius: 24 }}>
          <Component {...(item.props || {})} />
        </Animated.View>
      );
    },
    [width, height]
  );

  const baseOptions = React.useMemo(
    () => ({
      vertical: false,
      width,
      height,
    }),
    [width, height]
  );

  const handleProgressChange = React.useCallback(
    (offsetProgress: number) => {
      runOnJS(setActiveIndex)(Math.round(offsetProgress));
      if (onProgressChange) {
        runOnJS(onProgressChange)(offsetProgress);
      }
    },
    [onProgressChange]
  );

  const _renderDot = (_animationValue: number, _index: number) => {
    // ... existing code ...
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ width, height }}>
        <Carousel
          {...baseOptions}
          loop={false}
          data={items}
          renderItem={renderItem}
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: 0.9,
            parallaxScrollingOffset: 50,
          }}
          withAnimation={{
            type: 'spring',
            config: {
              damping: 20,
              mass: 1,
              stiffness: 100,
            },
          }}
          enabled={items.length > 1}
          onConfigurePanGesture={(gesture) => {
            gesture.activeOffsetX([-10, 10]).failOffsetY([-5, 5]);
          }}
          onProgressChange={handleProgressChange}
          defaultIndex={0}
        />
      </View>
    </GestureHandlerRootView>
  );
};
