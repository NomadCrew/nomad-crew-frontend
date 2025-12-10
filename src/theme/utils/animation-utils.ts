/**
 * Animation utilities for React Native components
 * Provides easy-to-use functions for implementing theme-based animations
 */

import { useMemo } from 'react';
import type { ViewStyle, TextStyle } from 'react-native';
import type { Theme } from '../types';
import { animationTokens } from '../foundations/animations';
import { createSemanticColorHelpers } from '../utils';

/**
 * Create animation style helpers for React Native Animated
 */
export const createAnimationUtils = (theme: Theme) => {
  const semantic = createSemanticColorHelpers(theme);
  
  return {
    /**
     * Get animation timing configuration
     */
    getTiming: (name: keyof typeof animationTokens.durations, easing?: keyof typeof animationTokens.easings) => ({
      duration: animationTokens.durations[name],
      easing: easing ? animationTokens.easings[easing] : animationTokens.easings.standard,
    }),

    /**
     * Get spring configuration
     */
    getSpring: (name: keyof typeof animationTokens.springs) => ({
      ...animationTokens.springs[name],
    }),

    /**
     * Get micro-interaction animation config
     */
    getMicroAnimation: (name: keyof typeof animationTokens.micro) => ({
      ...animationTokens.micro[name],
    }),

    /**
     * Get presence animation config
     */
    getPresenceAnimation: (name: keyof typeof animationTokens.presence) => ({
      ...animationTokens.presence[name],
    }),

    /**
     * Get loading animation config
     */
    getLoadingAnimation: (name: keyof typeof animationTokens.loading) => ({
      ...animationTokens.loading[name],
    }),

    /**
     * Get page transition config
     */
    getPageTransition: (name: keyof typeof animationTokens.transitions) => ({
      ...animationTokens.transitions[name],
    }),

    /**
     * Create button press animation style
     */
    createButtonPressStyle: (pressed: boolean): ViewStyle => ({
      transform: [
        { 
          scale: pressed 
            ? animationTokens.scales.buttonPress 
            : 1 
        }
      ],
      opacity: pressed 
        ? animationTokens.opacities.strong 
        : animationTokens.opacities.visible,
    }),

    /**
     * Create card hover animation style
     */
    createCardHoverStyle: (hovered: boolean): ViewStyle => ({
      transform: [
        { 
          scale: hovered 
            ? animationTokens.scales.cardHover 
            : 1 
        }
      ],
      elevation: hovered ? 8 : 2,
    }),

    /**
     * Create ripple animation style
     */
    createRippleStyle: (color?: string): ViewStyle => ({
      backgroundColor: color || theme.colors.primary.main,
      opacity: animationTokens.opacities.medium,
      borderRadius: 1000,
      transform: [{ scale: 0 }],
    }),

    /**
     * Create loading skeleton style
     */
    createSkeletonStyle: (width?: number | string, height?: number): ViewStyle => ({
      width: width || '100%',
      height: height || 20,
      backgroundColor: theme.colors.surface.variant,
      borderRadius: 4,
      overflow: 'hidden',
    }),

    /**
     * Create shimmer gradient style
     */
    createShimmerStyle: (): ViewStyle => ({
      backgroundColor: theme.colors.surface.main,
      opacity: animationTokens.opacities.strong,
    }),

    /**
     * Create fade transition style
     */
    createFadeStyle: (visible: boolean): ViewStyle => ({
      opacity: visible 
        ? animationTokens.opacities.visible 
        : animationTokens.opacities.invisible,
    }),

    /**
     * Create slide transition style
     */
    createSlideStyle: (
      direction: 'up' | 'down' | 'left' | 'right',
      visible: boolean,
      distance?: number
    ): ViewStyle => {
      const slideDistance = distance || animationTokens.transforms.slideMedium;
      
      const getTranslateValue = () => {
        if (visible) return 0;
        
        switch (direction) {
          case 'up':
            return slideDistance;
          case 'down':
            return -slideDistance;
          case 'left':
            return slideDistance;
          case 'right':
            return -slideDistance;
          default:
            return 0;
        }
      };

      return {
        transform: [
          direction === 'up' || direction === 'down'
            ? { translateY: getTranslateValue() }
            : { translateX: getTranslateValue() }
        ],
        opacity: visible 
          ? animationTokens.opacities.visible 
          : animationTokens.opacities.invisible,
      };
    },

    /**
     * Create scale transition style
     */
    createScaleStyle: (visible: boolean, scale?: number): ViewStyle => ({
      transform: [
        { 
          scale: visible 
            ? 1 
            : (scale || animationTokens.scales.shrinkSmall)
        }
      ],
      opacity: visible 
        ? animationTokens.opacities.visible 
        : animationTokens.opacities.invisible,
    }),

    /**
     * Create rotation style
     */
    createRotationStyle: (degrees: number): ViewStyle => ({
      transform: [{ rotate: `${degrees}deg` }],
    }),

    /**
     * Create presence indicator style
     */
    createPresenceIndicatorStyle: (
      status: 'online' | 'away' | 'busy' | 'offline' | 'typing',
      size: number = 8,
      animated: boolean = false
    ): ViewStyle => {
      const presenceColors = semantic.getPresenceColors(status);
      
      return {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: presenceColors.indicator,
        shadowColor: presenceColors.glow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: animated ? 0.8 : 0.4,
        shadowRadius: animated ? size / 2 : size / 4,
        elevation: 2,
        transform: animated && status === 'online' 
          ? [{ scale: animationTokens.scales.growTiny }]
          : [{ scale: 1 }],
      };
    },

    /**
     * Create typing indicator dots style
     */
    createTypingDotsStyle: (index: number): ViewStyle => ({
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: semantic.getPresenceColors('typing').indicator,
      marginHorizontal: 1,
    }),

    /**
     * Create notification badge style
     */
    createNotificationBadgeStyle: (count: number, size: number = 20): ViewStyle => ({
      minWidth: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: theme.colors.error?.main || '#EF4444',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: -size / 4,
      right: -size / 4,
      zIndex: 10,
      transform: count > 0 
        ? [{ scale: 1 }]
        : [{ scale: animationTokens.scales.shrinkMedium }],
    }),

    /**
     * Create pull-to-refresh style
     */
    createPullRefreshStyle: (progress: number): ViewStyle => ({
      transform: [
        { 
          rotate: `${progress * animationTokens.transforms.rotateFull}deg` 
        },
        { 
          scale: Math.max(0.5, progress) 
        }
      ],
      opacity: Math.max(0.3, progress),
    }),

    /**
     * Create loading spinner style
     */
    createSpinnerStyle: (size: number = 24, color?: string): ViewStyle => ({
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderColor: 'transparent',
      borderTopColor: color || theme.colors.primary.main,
    }),

    /**
     * Create progress bar style
     */
    createProgressStyle: (progress: number, height: number = 4): ViewStyle => ({
      width: `${Math.max(0, Math.min(100, progress * 100))}%`,
      height,
      backgroundColor: theme.colors.primary.main,
      borderRadius: height / 2,
    }),
  };
};

/**
 * Hook to get animation utilities
 */
export const useAnimationUtils = (theme: Theme) => {
  return useMemo(() => createAnimationUtils(theme), [theme]);
};

/**
 * Predefined animation presets for common use cases
 */
export const animationPresets = {
  /**
   * Button interaction preset
   */
  button: {
    press: animationTokens.micro.buttonPress,
    release: animationTokens.micro.buttonRelease,
  },

  /**
   * Card interaction preset
   */
  card: {
    tap: animationTokens.micro.cardTap,
    hover: animationTokens.micro.cardHover,
  },

  /**
   * Modal presentation preset
   */
  modal: {
    slideUp: animationTokens.transitions.modalSlideUp,
    fade: animationTokens.transitions.modalFade,
  },

  /**
   * Page transition preset
   */
  page: {
    slideRight: animationTokens.transitions.slideFromRight,
    slideLeft: animationTokens.transitions.slideFromLeft,
    slideBottom: animationTokens.transitions.slideFromBottom,
  },

  /**
   * Loading state preset
   */
  loading: {
    fadeIn: animationTokens.loading.fadeIn,
    slideUp: animationTokens.loading.slideUp,
    bounceIn: animationTokens.loading.bounceIn,
    spinner: animationTokens.loading.spinner,
    shimmer: animationTokens.loading.shimmer,
  },

  /**
   * Presence indicator preset
   */
  presence: {
    onlinePulse: animationTokens.presence.onlinePulse,
    typingDots: animationTokens.presence.typingDots,
    statusChange: animationTokens.presence.statusChange,
    connecting: animationTokens.presence.connecting,
    notificationBadge: animationTokens.presence.notificationBadge,
  },
} as const;

/**
 * Animation timing utilities
 */
export const animationTiming = {
  /**
   * Get duration in milliseconds
   */
  duration: (name: keyof typeof animationTokens.durations) => 
    animationTokens.durations[name],

  /**
   * Get easing function
   */
  easing: (name: keyof typeof animationTokens.easings) => 
    animationTokens.easings[name],

  /**
   * Get scale value
   */
  scale: (name: keyof typeof animationTokens.scales) => 
    animationTokens.scales[name],

  /**
   * Get opacity value
   */
  opacity: (name: keyof typeof animationTokens.opacities) => 
    animationTokens.opacities[name],

  /**
   * Get transform value
   */
  transform: (name: keyof typeof animationTokens.transforms) => 
    animationTokens.transforms[name],
} as const; 