import React, { useCallback, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    withRepeat,
    withSequence,
    runOnJS,
    Easing,
    interpolate,
  } from 'react-native-reanimated';
  import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Todo } from '@/src/types/todo';
import { useTheme } from '@/src/theme/ThemeProvider';
import LottieView from 'lottie-react-native';

interface TodoItemProps {
  todo: Todo;
  onComplete: () => Promise<Todo>;
  onDelete: () => Promise<void>;
  textColor?: string;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 80;
const DELETE_DURATION = 1200;

export const TodoItem = ({
  todo,
  onComplete,
  onDelete,
  textColor = '#000'
}: TodoItemProps) => {
  const translateX = useSharedValue(0);
  const pressed = useSharedValue(false);
  const deleteProgress = useSharedValue(0);
  const scrolling = useSharedValue(false);
  const textWidth = useSharedValue(0);
  const containerWidth = useSharedValue(0);

  const textRef = useRef<Text>(null);

  // Gesture handlers
  const panStartX = useSharedValue(0);
  const longPressStartTime = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      panStartX.value = translateX.value;
    })
    .onUpdate((e) => {
      translateX.value = panStartX.value + e.translationX;
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      }
    })
    .onEnd(() => {
      translateX.value = Math.abs(translateX.value) > SWIPE_THRESHOLD
        ? withSpring(SWIPE_THRESHOLD * Math.sign(translateX.value))
        : withSpring(0);
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) runOnJS(onDelete)();
    });
  
    const longPressGesture = Gesture.LongPress()
    .minDuration(DELETE_DURATION)
    .onBegin(() => {
      pressed.value = true;
      longPressStartTime.value = Date.now();
      deleteProgress.value = withTiming(1, {
        duration: DELETE_DURATION,
        easing: Easing.linear,
      });
    })
    .onEnd(() => {
      runOnJS(onComplete)();
    })
    .onFinalize(() => {
      pressed.value = false;
      deleteProgress.value = withTiming(0, {
        duration: 250,
        easing: Easing.bezier(0.82, 0.06, 0.42, 1.01),
      });
    });  

  // Animated styles
  const { theme } = useTheme();

const containerStyle = useAnimatedStyle(() => ({
  backgroundColor: theme.colors.background.default,
  transform: [{ translateX: translateX.value }],
  position: 'relative',
  overflow: 'hidden',
  opacity: pressed.value ? 0.9 : 1,
}));

const textContainerStyle = useAnimatedStyle(() => ({
  opacity: pressed.value ? 0.7 : 1,
}));

const textStyle = useAnimatedStyle(() => {
  'worklet';
  const currentScrolling = scrolling.value;
  const currentTextWidth = textWidth.value;
  const currentContainerWidth = containerWidth.value;

  if (!currentScrolling || currentTextWidth <= currentContainerWidth) {
    return {};
  }

  return {
    transform: [
      {
        translateX: withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(-(currentTextWidth - currentContainerWidth), {
              duration: 3000,
              easing: Easing.linear,
            }),
            withTiming(0, { duration: 1000 })
          ),
          -1,
          true
        ),
      },
    ],
  };
});

const progressStyle = useAnimatedStyle(() => {
  'worklet';
  const currentContainerWidth = containerWidth.value;
  const width = interpolate(
    deleteProgress.value,
    [0, 1],
    [0, currentContainerWidth]
  );
  
  return {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width,
    backgroundColor: theme.colors.status.success.background,
    color: theme.colors.status.success.content,
    opacity: 0.9,
  };
});

  // Measure text and container width
  const onTextLayout = useCallback((event: {
    nativeEvent: { layout: { width: number } }
    }) => {
        textWidth.value = event.nativeEvent.layout.width;
    }, []);

  const onContainerLayout = useCallback((event: {
    nativeEvent: { layout: { width: number } }
    }) => {
        containerWidth.value = event.nativeEvent.layout.width;
    }, []);

  return (
    <GestureDetector gesture={Gesture.Race(panGesture, longPressGesture)}>
    <Animated.View 
      style={[styles.container, containerStyle]}
      onLayout={onContainerLayout}
    >
      <Animated.View style={progressStyle} />
      <Animated.View 
        style={[styles.textContainer, textContainerStyle]}
        onTouchStart={() => {
          scrolling.value = true;
        }}
        onTouchEnd={() => {
          scrolling.value = false;
        }}
      >
          <Animated.Text
            ref={textRef}
            style={[
              styles.text,
              { color: textColor },
              textStyle
            ]}
            onLayout={onTextLayout}
            numberOfLines={1}
          >
            {todo.text}
          </Animated.Text>
        </Animated.View>
        <Animated.View style={styles.statusIndicator}>
          {todo.status === 'COMPLETE' ? (
            <Check  
              size={16} 
              color={theme.colors.status.success.background} 
            />
          ) : (
            <View style={[
              styles.dot, 
              { backgroundColor: theme.colors.status.planning.background }
            ]} />
          )}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusIndicator: {
    marginLeft: 8,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});