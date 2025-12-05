/**
 * Animation foundation tokens
 * Provides consistent timing, easing, and motion patterns across the app
 */

// Duration tokens - consistent timing for all animations
export const animationDurations = {
  // Micro-interactions (50-150ms)
  instant: 50,
  micro: 100,
  fast: 150,
  
  // Standard interactions (200-300ms)
  quick: 200,
  normal: 250,
  smooth: 300,
  
  // Complex transitions (400-600ms)
  slow: 400,
  slower: 500,
  slowest: 600,
  
  // Presence indicators
  pulse: 1000,
  breathe: 2000,
  typing: 1500,
} as const;

// Easing curves - based on Material Design and iOS guidelines
export const animationEasings = {
  // Standard curves
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  
  // Material Design curves
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Standard
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)', // Decelerate
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)', // Accelerate
  sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)', // Sharp
  
  // iOS curves
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bouncy
  gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Gentle
  smooth: 'cubic-bezier(0.645, 0.045, 0.355, 1)', // Smooth
  
  // Custom curves for specific interactions
  button: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Button press
  modal: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Modal transitions
  drawer: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Drawer slide
  page: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Page transitions
} as const;

// Scale values for zoom animations
export const animationScales = {
  // Shrink scales
  shrinkTiny: 0.95,
  shrinkSmall: 0.9,
  shrinkMedium: 0.8,
  shrinkLarge: 0.7,
  
  // Grow scales
  growTiny: 1.05,
  growSmall: 1.1,
  growMedium: 1.2,
  growLarge: 1.3,
  growXLarge: 1.5,
  
  // Button interactions
  buttonPress: 0.96,
  buttonHover: 1.02,
  
  // Card interactions
  cardHover: 1.02,
  cardPress: 0.98,
  
  // Icon interactions
  iconPress: 0.9,
  iconHover: 1.1,
} as const;

// Transform values for slide animations
export const animationTransforms = {
  // Slide distances (in pixels)
  slideMinimal: 4,
  slideSmall: 8,
  slideMedium: 16,
  slideLarge: 24,
  slideXLarge: 32,
  
  // Rotation angles (in degrees)
  rotateSubtle: 2,
  rotateSmall: 5,
  rotateMedium: 15,
  rotateLarge: 30,
  rotateQuarter: 90,
  rotateHalf: 180,
  rotateFull: 360,
  
  // Skew angles (in degrees)
  skewSubtle: 1,
  skewSmall: 2,
  skewMedium: 5,
  skewLarge: 10,
} as const;

// Opacity values for fade animations
export const animationOpacities = {
  invisible: 0,
  faint: 0.1,
  subtle: 0.2,
  light: 0.3,
  medium: 0.5,
  strong: 0.7,
  mostlyVisible: 0.9,
  visible: 1,
} as const;

// Spring physics configurations for React Native Reanimated
export const springConfigs = {
  // Quick interactions
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
  
  // Standard interactions
  gentle: {
    damping: 25,
    stiffness: 200,
    mass: 1,
  },
  
  // Smooth interactions
  smooth: {
    damping: 30,
    stiffness: 150,
    mass: 1,
  },
  
  // Bouncy interactions
  bouncy: {
    damping: 15,
    stiffness: 250,
    mass: 0.8,
  },
  
  // Wobbly interactions
  wobbly: {
    damping: 10,
    stiffness: 180,
    mass: 1.2,
  },
  
  // Slow interactions
  slow: {
    damping: 35,
    stiffness: 100,
    mass: 1.5,
  },
} as const;

// Micro-interaction patterns
export const microInteractions = {
  // Button interactions
  buttonPress: {
    duration: animationDurations.micro,
    easing: animationEasings.button,
    scale: animationScales.buttonPress,
    opacity: animationOpacities.strong,
  },
  
  buttonRelease: {
    duration: animationDurations.fast,
    easing: animationEasings.gentle,
    scale: 1,
    opacity: animationOpacities.visible,
  },
  
  // Card interactions
  cardTap: {
    duration: animationDurations.micro,
    easing: animationEasings.sharp,
    scale: animationScales.cardPress,
  },
  
  cardHover: {
    duration: animationDurations.quick,
    easing: animationEasings.gentle,
    scale: animationScales.cardHover,
    elevation: 8,
  },
  
  // Icon interactions
  iconPress: {
    duration: animationDurations.micro,
    easing: animationEasings.bouncy,
    scale: animationScales.iconPress,
  },
  
  iconBounce: {
    duration: animationDurations.normal,
    easing: animationEasings.bouncy,
    scale: animationScales.iconHover,
  },
  
  // Ripple effect
  ripple: {
    duration: animationDurations.slow,
    easing: animationEasings.decelerate,
    scale: animationScales.growLarge,
    opacity: [animationOpacities.medium, animationOpacities.invisible],
  },
} as const;

// Presence-specific animations
export const presenceAnimations = {
  // Online indicator pulse
  onlinePulse: {
    duration: animationDurations.pulse,
    easing: animationEasings.smooth,
    scale: [1, animationScales.growTiny, 1],
    opacity: [animationOpacities.visible, animationOpacities.strong, animationOpacities.visible],
    infinite: true,
  },
  
  // Typing indicator dots
  typingDots: {
    duration: animationDurations.typing,
    easing: animationEasings.gentle,
    translateY: [0, -animationTransforms.slideSmall, 0],
    opacity: [animationOpacities.medium, animationOpacities.visible, animationOpacities.medium],
    infinite: true,
    staggerDelay: animationDurations.micro,
  },
  
  // Status transition
  statusChange: {
    duration: animationDurations.normal,
    easing: animationEasings.standard,
    scale: [1, animationScales.growSmall, 1],
    opacity: [animationOpacities.invisible, animationOpacities.visible],
  },
  
  // Connection status
  connecting: {
    duration: animationDurations.breathe,
    easing: animationEasings.smooth,
    opacity: [animationOpacities.medium, animationOpacities.visible, animationOpacities.medium],
    infinite: true,
  },
  
  // Notification badge
  notificationBadge: {
    duration: animationDurations.normal,
    easing: animationEasings.bouncy,
    scale: [0, animationScales.growSmall, 1],
    opacity: [animationOpacities.invisible, animationOpacities.visible],
  },
} as const;

// Loading state animations
export const loadingAnimations = {
  // Spinner rotation
  spinner: {
    duration: animationDurations.pulse,
    easing: animationEasings.linear,
    rotate: [0, animationTransforms.rotateFull],
    infinite: true,
  },
  
  // Skeleton shimmer
  shimmer: {
    duration: animationDurations.breathe,
    easing: animationEasings.smooth,
    translateX: [-100, 100],
    infinite: true,
  },
  
  // Fade in content
  fadeIn: {
    duration: animationDurations.normal,
    easing: animationEasings.decelerate,
    opacity: [animationOpacities.invisible, animationOpacities.visible],
    translateY: [animationTransforms.slideMedium, 0],
  },
  
  // Slide up
  slideUp: {
    duration: animationDurations.smooth,
    easing: animationEasings.decelerate,
    translateY: [animationTransforms.slideLarge, 0],
    opacity: [animationOpacities.invisible, animationOpacities.visible],
  },
  
  // Bounce in
  bounceIn: {
    duration: animationDurations.slow,
    easing: animationEasings.bouncy,
    scale: [0, animationScales.growSmall, 1],
    opacity: [animationOpacities.invisible, animationOpacities.visible],
  },
} as const;

// Page transition animations
export const pageTransitions = {
  // Stack navigation
  slideFromRight: {
    duration: animationDurations.smooth,
    easing: animationEasings.standard,
    translateX: ['100%', 0],
  },
  
  slideFromLeft: {
    duration: animationDurations.smooth,
    easing: animationEasings.standard,
    translateX: ['-100%', 0],
  },
  
  slideFromBottom: {
    duration: animationDurations.smooth,
    easing: animationEasings.standard,
    translateY: ['100%', 0],
  },
  
  // Modal presentations
  modalSlideUp: {
    duration: animationDurations.smooth,
    easing: animationEasings.decelerate,
    translateY: ['100%', 0],
    opacity: [animationOpacities.invisible, animationOpacities.visible],
  },
  
  modalFade: {
    duration: animationDurations.normal,
    easing: animationEasings.smooth,
    opacity: [animationOpacities.invisible, animationOpacities.visible],
    scale: [animationScales.shrinkSmall, 1],
  },
  
  // Tab transitions
  tabSlide: {
    duration: animationDurations.quick,
    easing: animationEasings.sharp,
    translateX: [animationTransforms.slideSmall, 0],
    opacity: [animationOpacities.strong, animationOpacities.visible],
  },
} as const;

// Export all animation tokens
export const animationTokens = {
  durations: animationDurations,
  easings: animationEasings,
  scales: animationScales,
  transforms: animationTransforms,
  opacities: animationOpacities,
  springs: springConfigs,
  micro: microInteractions,
  presence: presenceAnimations,
  loading: loadingAnimations,
  transitions: pageTransitions,
} as const; 