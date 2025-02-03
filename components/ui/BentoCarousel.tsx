import React from 'react';
import { View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';

interface CarouselItem {
  id: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

interface BentoCarouselProps {
  items: CarouselItem[];
  width: number;
  height: number;
}

export const BentoCarousel = ({ items, width, height }: BentoCarouselProps) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const renderItem = React.useCallback(({ item, animationValue }: { 
    item: CarouselItem; 
    index: number;
    animationValue: Animated.SharedValue<number>;
  }) => {
    const Component = item.component;
    
    return (
      <Animated.View style={{ width, height }}>
        <Component {...(item.props || {})} />
      </Animated.View>
    );
  }, [width, height]);

  const baseOptions = React.useMemo(() => ({
    vertical: false,
    width,
    height,
  }), [width, height]);

  const onProgressChange = React.useCallback((offsetProgress: number) => {
    runOnJS(setCurrentIndex)(Math.round(offsetProgress));
  }, []);

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
          panGestureHandlerProps={{
            activeOffsetX: [-10, 10],
            failOffsetY: [-5, 5],
          }}
          onProgressChange={onProgressChange}
          defaultIndex={0}
        />
      </View>
    </GestureHandlerRootView>
  );
};