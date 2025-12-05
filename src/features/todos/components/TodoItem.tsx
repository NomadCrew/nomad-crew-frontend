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
    interpolateColor,
  } from 'react-native-reanimated';
  import { Check, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Todo } from '../types'; // Corrected relative path
import { useAppTheme } from '@/src/theme/ThemeProvider';
import LottieView from 'lottie-react-native';

// Constants
const SWIPE_THRESHOLD = 80;
const DELETE_DURATION = 1200;

// Common styles
const NO_SHADOW = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};

interface TodoItemProps {
  todo: Todo;
  onComplete: () => Promise<Todo>;
  onDelete: () => Promise<void>;
  textColor?: string;
  disabled?: boolean;
}

export const TodoItem = ({
  todo,
  onComplete,
  onDelete,
  textColor = '#000',
  disabled = false,
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
  const { theme } = useAppTheme();

const containerStyle = useAnimatedStyle(() => {
  const swipeProgress = Math.abs(translateX.value) / SWIPE_THRESHOLD;
  const isSwipingLeft = translateX.value < 0;
  
  return {
    backgroundColor: todo.status === 'COMPLETE' 
      ? theme.colors.background.surface[50] 
      : theme.colors.background.surface[100],
    transform: [{ translateX: translateX.value }],
    position: 'relative',
    overflow: 'hidden',
    opacity: pressed.value ? 0.9 : 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 12,
    borderLeftWidth: todo.status === 'COMPLETE' ? 4 : 1,
    borderLeftColor: todo.status === 'COMPLETE' 
      ? theme.colors.status.success.background 
      : 'rgba(0, 0, 0, 0.08)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: isSwipingLeft && swipeProgress > 0.5 ? 4 : 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    borderRightColor: isSwipingLeft && swipeProgress > 0.5 
      ? theme.colors.status.error.background 
      : 'rgba(0, 0, 0, 0.08)',
  };
});

const textContainerStyle = useAnimatedStyle(() => ({
  opacity: pressed.value ? 0.7 : 1,
}));

const textStyle = useAnimatedStyle(() => {
  'worklet';
  const currentScrolling = scrolling.value;
  const currentTextWidth = textWidth.value;
  const currentContainerWidth = containerWidth.value;

  if (!currentScrolling || currentTextWidth <= currentContainerWidth) {
    return {
      textDecorationLine: todo.status === 'COMPLETE' ? 'line-through' : 'none',
      color: todo.status === 'COMPLETE' ? theme.colors.content.tertiary : textColor,
    };
  }

  return {
    textDecorationLine: todo.status === 'COMPLETE' ? 'line-through' : 'none',
    color: todo.status === 'COMPLETE' ? theme.colors.content.tertiary : textColor,
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
    opacity: 0.2,
    borderRadius: 12,
  };
});

// Add a delete indicator that appears when swiping left
const deleteIndicatorStyle = useAnimatedStyle(() => {
  const opacity = interpolate(
    translateX.value,
    [0, -SWIPE_THRESHOLD/2, -SWIPE_THRESHOLD],
    [0, 0.5, 1]
  );
  
  return {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity,
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
      <View style={styles.itemWrapper}>
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
                textStyle,
              ]}
              onLayout={onTextLayout}
            >
              {todo.text}
            </Animated.Text>
          </Animated.View>
          <Animated.View style={deleteIndicatorStyle}>
            <Trash2 color={theme.colors.status.error.content} size={20} />
          </Animated.View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  itemWrapper: {
    marginBottom: 10,
  },
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...NO_SHADOW, // Ensure no shadow
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 