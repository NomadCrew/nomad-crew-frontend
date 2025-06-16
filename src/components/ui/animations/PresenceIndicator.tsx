/**
 * PresenceIndicator - Animated presence status indicator
 * Shows user online status with smooth animations and pulse effects
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAnimationUtils } from '../../../theme/utils/animation-utils';
import type { PresenceStatus } from '../../../theme/types';

interface PresenceIndicatorProps {
  status: PresenceStatus;
  size?: number;
  showPulse?: boolean;
  animated?: boolean;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  status,
  size = 8,
  showPulse = true,
  animated = true,
}) => {
  const { theme } = useAppTheme();
  const animations = useAnimationUtils(theme);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Start pulse animation for online status
  useEffect(() => {
    if (status === 'online' && showPulse && animated) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, showPulse, animated, pulseAnim]);

  // Mount animation
  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 250,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [animated, scaleAnim, opacityAnim]);

  // Status change animation
  useEffect(() => {
    if (animated) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [status, animated, scaleAnim]);

  const indicatorStyle = animations.createPresenceIndicatorStyle(status, size, animated);

  if (status === 'typing') {
    return <TypingIndicator size={size} animated={animated} />;
  }

  return (
    <Animated.View
      style={[
        indicatorStyle,
        {
          transform: [
            { scale: animated ? scaleAnim : 1 },
            { scale: animated && status === 'online' && showPulse ? pulseAnim : 1 },
          ],
          opacity: animated ? opacityAnim : 1,
        },
      ]}
    />
  );
};

/**
 * TypingIndicator - Animated dots for typing status
 */
interface TypingIndicatorProps {
  size?: number;
  animated?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  size = 8,
  animated = true,
}) => {
  const { theme } = useAppTheme();
  const animations = useAnimationUtils(theme);
  
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const createDotAnimation = (animValue: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(300),
          ])
        );

      const animation1 = createDotAnimation(dot1Anim, 0);
      const animation2 = createDotAnimation(dot2Anim, 100);
      const animation3 = createDotAnimation(dot3Anim, 200);

      animation1.start();
      animation2.start();
      animation3.start();

      return () => {
        animation1.stop();
        animation2.stop();
        animation3.stop();
      };
    }
  }, [animated, dot1Anim, dot2Anim, dot3Anim]);

  const dotStyle = animations.createTypingDotsStyle(0);
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Animated.View
        style={[
          dotStyle,
          {
            transform: [
              {
                translateY: animated
                  ? dot1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4],
                    })
                  : 0,
              },
            ],
            opacity: animated
              ? dot1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                })
              : 1,
          },
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          {
            transform: [
              {
                translateY: animated
                  ? dot2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4],
                    })
                  : 0,
              },
            ],
            opacity: animated
              ? dot2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                })
              : 1,
          },
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          {
            transform: [
              {
                translateY: animated
                  ? dot3Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4],
                    })
                  : 0,
              },
            ],
            opacity: animated
              ? dot3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                })
              : 1,
          },
        ]}
      />
    </View>
  );
}; 