import { ColorValue, TextStyle, ViewStyle } from 'react-native';
import { SemanticColors } from './foundations/colors';
import { SemanticSpacing } from './foundations/spacing';
import { Typography } from './foundations/typography';
import { SemanticElevation } from './foundations/elevation';
import { animationTokens } from './foundations/animations';

export type ThemeMode = 'light' | 'dark' | 'system';

// Define breakpoints
export const BREAKPOINTS = {
  mobile: 320,
  tablet: 720,
  desktop: 1024,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Single ThemeOptions interface
export interface ThemeOptions {
  isDark?: boolean;
  fontFamily?: string;
  spacing?: Partial<SemanticSpacing>;
  borderRadius?: {
    none?: number;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    full?: number;
  };
  breakpoints?: typeof BREAKPOINTS;
}

export interface ComponentStyles {
  Button?: {
    base?: ViewStyle;
    variants?: Record<string, ViewStyle>;
    sizes?: Record<string, ViewStyle & Partial<TextStyle>>;
  };
  Container?: {
    base?: ViewStyle;
    variants?: Record<string, ViewStyle>;
  };
}

// Extended Status colors interface to include missing properties
export interface StatusColors {
  error: {
    surface: string;
    content: string;
    background: string;
    border: string;
    main?: string;
  };
  success: {
    surface: string;
    content: string;
    background: string;
    border: string;
    main?: string;
  };
  warning: {
    surface: string;
    content: string;
    background?: string;
    border?: string;
    main?: string;
  };
  info: {
    surface: string;
    content: string;
    background?: string;
    border?: string;
    main?: string;
  };
  planning: {
    background: string;
    content: string;
  };
  completed: {
    background: string;
    content: string;
  };
}

// NEW: Trip Status interface
export interface TripStatusColors {
  draft: {
    background: string;
    content: string;
    border: string;
    icon: string;
  };
  planning: {
    background: string;
    content: string;
    border: string;
    icon: string;
  };
  active: {
    background: string;
    content: string;
    border: string;
    icon: string;
  };
  completed: {
    background: string;
    content: string;
    border: string;
    icon: string;
  };
  cancelled: {
    background: string;
    content: string;
    border: string;
    icon: string;
  };
}

// NEW: Member Role interface
export interface MemberRoleColors {
  owner: {
    background: string;
    content: string;
    border: string;
    icon: string;
    badge: string;
  };
  admin: {
    background: string;
    content: string;
    border: string;
    icon: string;
    badge: string;
  };
  moderator: {
    background: string;
    content: string;
    border: string;
    icon: string;
    badge: string;
  };
  member: {
    background: string;
    content: string;
    border: string;
    icon: string;
    badge: string;
  };
  viewer: {
    background: string;
    content: string;
    border: string;
    icon: string;
    badge: string;
  };
}

// NEW: Presence interface
export interface PresenceColors {
  online: {
    indicator: string;
    background: string;
    content: string;
    glow: string;
  };
  away: {
    indicator: string;
    background: string;
    content: string;
    glow: string;
  };
  busy: {
    indicator: string;
    background: string;
    content: string;
    glow: string;
  };
  offline: {
    indicator: string;
    background: string;
    content: string;
    glow: string;
  };
  typing: {
    indicator: string;
    background: string;
    content: string;
    animation: string;
  };
}

// NEW: Animation types
export type AnimationTokens = typeof animationTokens;
export type AnimationDuration = keyof typeof animationTokens.durations;
export type AnimationEasing = keyof typeof animationTokens.easings;
export type AnimationScale = keyof typeof animationTokens.scales;
export type AnimationTransform = keyof typeof animationTokens.transforms;
export type AnimationOpacity = keyof typeof animationTokens.opacities;
export type SpringConfig = keyof typeof animationTokens.springs;
export type MicroInteraction = keyof typeof animationTokens.micro;
export type PresenceAnimation = keyof typeof animationTokens.presence;
export type LoadingAnimation = keyof typeof animationTokens.loading;
export type PageTransition = keyof typeof animationTokens.transitions;

// Animation configuration interfaces
export interface AnimationConfig {
  duration?: number;
  easing?: string;
  useNativeDriver?: boolean;
  delay?: number;
}

export interface SpringAnimationConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
  useNativeDriver?: boolean;
  delay?: number;
}

export interface TimingAnimationConfig extends AnimationConfig {
  toValue: number;
}

export interface SpringAnimationProperties extends SpringAnimationConfig {
  toValue: number;
}

// Extended colors to include disabled state and new semantic colors
export interface ExtendedColors {
  disabled?: {
    background: string;
    text: string;
    border: string;
  };
  outlined?: {
    background: string;
    text: string;
    border?: string;
  };
  success?: {
    surface: string;
    main: string;
  };
  warning?: {
    surface: string;
    main: string;
  };
  error?: {
    surface: string;
    main: string;
  };
  info?: {
    surface: string;
    main: string;
  };
  // NEW: Adding new semantic color categories
  tripStatus?: TripStatusColors;
  memberRoles?: MemberRoleColors;
  presence?: PresenceColors;
}

// Font size interface for typography
export interface FontSizes {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

// Extended Typography interface - Typography already includes size and fontSizes
export type ExtendedTypography = Typography;

export interface ThemeColors {
  // ... other color definitions
  error: {
    background: string;
    content: string;
    border: string;
  };
}

export interface Theme {
  colors: SemanticColors & ExtendedColors;
  typography: ExtendedTypography;
  spacing: SemanticSpacing;
  elevation: SemanticElevation;
  components: ComponentStyles;
  breakpoints: typeof BREAKPOINTS;
  borderRadius: {
    none: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  shape?: {
    borderRadius: {
      small: number;
      medium: number;
      large: number;
    };
  };
  dark?: boolean;
}

// Helper types
export type ThemeNestedValue<T> = T | Record<string, T>;
export type ThemeColorValue = ColorValue | keyof SemanticColors;
