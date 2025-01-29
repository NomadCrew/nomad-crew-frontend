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
    interpolateColor,
    Easing,
  } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Todo } from '@/src/types/todo';
import { useTheme } from '@/src/theme/ThemeProvider';

type PanContext = {
    startX: number;
};

type LongPressContext = {
    startTime: number;
};

interface TodoItemProps {
  todo: Todo;
  onComplete: () => Promise<Todo>;
  onDelete: () => Promise<void>;
  textColor?: string;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 80;
const DELETE_DURATION = 3000;
const DELETE_THRESHOLD = 0.7;

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
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) runOnJS(onComplete)();
    });
  

    const longPressGesture = Gesture.LongPress()
    .minDuration(DELETE_DURATION)
    .onStart(() => {
      pressed.value = true;
      longPressStartTime.value = Date.now();
      // Start the progress animation
      deleteProgress.value = withTiming(1, {
        duration: DELETE_DURATION,
        easing: Easing.linear,
      });
    })
    .onEnd(() => {
      pressed.value = false;
      const elapsedTime = Date.now() - longPressStartTime.value;
      if (elapsedTime >= DELETE_THRESHOLD * DELETE_DURATION) {
        runOnJS(onDelete)();
      }
      deleteProgress.value = withTiming(0);
    })
    .onTouchesMove(() => {
      // Optional: Cancel the long press if user moves their finger
      deleteProgress.value = withTiming(0);
    })
    .onTouchesCancelled(() => {
      pressed.value = false;
      deleteProgress.value = withTiming(0);
    });

  // Animated styles
  const { theme } = useTheme();
  const containerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
        deleteProgress.value,
        [0, 1],
        [theme.colors.background.default, theme.colors.primary.pressed]
    );

    return {
      backgroundColor,
      transform: [{ translateX: translateX.value }],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    if (!scrolling.value || textWidth.value <= containerWidth.value) {
      return {};
    }

    return {
      transform: [
        {
          translateX: withRepeat(
            withSequence(
              withTiming(0, { duration: 0 }),
              withTiming(-(textWidth.value - containerWidth.value), {
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
        <Animated.View 
          style={[styles.textContainer, { opacity: pressed.value ? 0.7 : 1 }]}
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
          <View 
            style={[
              styles.dot,
              { backgroundColor: todo.status === 'COMPLETE' ? '#4CAF50' : '#FFC107' }
            ]} 
          />
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
    backgroundColor: 'white',
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