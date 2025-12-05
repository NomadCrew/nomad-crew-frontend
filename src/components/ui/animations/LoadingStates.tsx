/**
 * LoadingStates - Animated loading components
 * Provides spinners, skeletons, and shimmer effects using the animation system
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAnimationUtils } from '../../../theme/utils/animation-utils';
import { animationTokens } from '../../../theme/foundations/animations';

const { width: screenWidth } = Dimensions.get('window');

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  animated?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 24,
  color,
  animated = true,
}) => {
  const { theme } = useAppTheme();
  const animations = useAnimationUtils(theme);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const spinAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: animationTokens.durations.pulse,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();

      return () => spinAnimation.stop();
    }
  }, [animated, rotateAnim]);

  const spinnerStyle = animations.createSpinnerStyle(size, color);

  return (
    <Animated.View
      style={[
        spinnerStyle,
        {
          transform: [
            {
              rotate: animated
                ? rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                : '0deg',
            },
          ],
        },
      ]}
    />
  );
};

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  animated?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  animated = true,
}) => {
  const { theme } = useAppTheme();
  const animations = useAnimationUtils(theme);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const shimmerAnimation = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: animationTokens.durations.breathe,
          useNativeDriver: true,
        })
      );
      shimmerAnimation.start();

      return () => shimmerAnimation.stop();
    }
  }, [animated, shimmerAnim]);

  const skeletonStyle = animations.createSkeletonStyle(width, height);
  const isDark = theme.dark;

  const shimmerColors = isDark
    ? ['#374151', '#4B5563', '#374151']
    : ['#F3F4F6', '#E5E7EB', '#F3F4F6'];

  return (
    <View style={[skeletonStyle, { borderRadius }]}>
      {animated && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: [
                {
                  translateX: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-200, 200],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={shimmerColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: 200,
              height: '100%',
            }}
          />
        </Animated.View>
      )}
    </View>
  );
};

interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
  animated?: boolean;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = '60%',
  animated = true,
}) => {
  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={16}
          animated={animated}
        />
      ))}
    </View>
  );
};

interface SkeletonCardProps {
  showAvatar?: boolean;
  showButton?: boolean;
  animated?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = true,
  showButton = true,
  animated = true,
}) => {
  const { theme } = useAppTheme();
  const animations = useAnimationUtils(theme);

  return (
    <View style={[
      animations.createSkeletonStyle('100%', 120),
      { padding: 16, gap: 12 }
    ]}>
      {/* Header with avatar and title */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {showAvatar && (
          <Skeleton
            width={40}
            height={40}
            borderRadius={20}
            animated={animated}
          />
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <Skeleton width="60%" height={16} animated={animated} />
          <Skeleton width="40%" height={12} animated={animated} />
        </View>
      </View>

      {/* Content */}
      <SkeletonText lines={2} animated={animated} />

      {/* Button */}
      {showButton && (
        <View style={{ marginTop: 8 }}>
          <Skeleton width={80} height={32} borderRadius={16} animated={animated} />
        </View>
      )}
    </View>
  );
};

interface SkeletonListProps {
  itemCount?: number;
  showAvatar?: boolean;
  animated?: boolean;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  itemCount = 5,
  showAvatar = true,
  animated = true,
}) => {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          {showAvatar && (
            <Skeleton
              width={32}
              height={32}
              borderRadius={16}
              animated={animated}
            />
          )}
          <View style={{ flex: 1, gap: 4 }}>
            <Skeleton width="70%" height={14} animated={animated} />
            <Skeleton width="50%" height={12} animated={animated} />
          </View>
        </View>
      ))}
    </View>
  );
};

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  animated?: boolean;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  delay = 0,
  duration = 250,
  animated = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      translateAnim.setValue(0);
    }
  }, [animated, fadeAnim, translateAnim, delay, duration]);

  return (
    <Animated.View
      style={{
        opacity: animated ? fadeAnim : 1,
        transform: [
          {
            translateY: animated ? translateAnim : 0,
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

interface PulseViewProps {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  animated?: boolean;
}

export const PulseView: React.FC<PulseViewProps> = ({
  children,
  scale = 1.05,
  duration = 1000,
  animated = true,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: scale,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [animated, pulseAnim, scale, duration]);

  return (
    <Animated.View
      style={{
        transform: [
          {
            scale: animated ? pulseAnim : 1,
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

interface SlideInViewProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  duration?: number;
  delay?: number;
  animated?: boolean;
}

export const SlideInView: React.FC<SlideInViewProps> = ({
  children,
  direction = 'up',
  distance = 50,
  duration = 300,
  delay = 0,
  animated = true,
}) => {
  const slideAnim = useRef(new Animated.Value(distance)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      opacityAnim.setValue(1);
    }
  }, [animated, slideAnim, opacityAnim, duration, delay]);

  const getTransform = () => {
    const translateValue = animated ? slideAnim : 0;
    
    switch (direction) {
      case 'up':
        return [{ translateY: translateValue }];
      case 'down':
        return [{ translateY: translateValue.interpolate({ inputRange: [0, distance], outputRange: [0, -distance] }) }];
      case 'left':
        return [{ translateX: translateValue }];
      case 'right':
        return [{ translateX: translateValue.interpolate({ inputRange: [0, distance], outputRange: [0, -distance] }) }];
      default:
        return [{ translateY: translateValue }];
    }
  };

  return (
    <Animated.View
      style={{
        opacity: animated ? opacityAnim : 1,
        transform: getTransform(),
      }}
    >
      {children}
    </Animated.View>
  );
}; 