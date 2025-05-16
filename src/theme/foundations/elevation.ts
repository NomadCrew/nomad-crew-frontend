import { Platform } from 'react-native';

// Helper to generate elevation styles for both platforms
const createElevation = (
  level: number,
  color = '#000',
  opacity = 0.15,
) => ({
  ...Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: {
        width: 0,
        height: level * 0.5,
      },
      shadowOpacity: opacity,
      shadowRadius: level * 0.8,
    },
    android: {
      elevation: level,
      shadowColor: color,
    },
  }),
});

// Base elevation tokens
export const elevationTokens = {
  // No elevation - flat surface
  none: createElevation(0),

  // Subtle elevation - cards, buttons
  low: createElevation(2),

  // Medium elevation - floating action buttons, dropdowns
  medium: createElevation(4, '#000', 0.18),

  // High elevation - modals, dialogs
  high: createElevation(8, '#000', 0.2),

  // Highest elevation - tooltips, popovers
  highest: createElevation(16, '#000', 0.25),
} as const;

// Create semantic elevation styles with color consideration
export const createSemanticElevation = (isDark: boolean) => ({
  // Interactive elements
  button: {
    rest: elevationTokens.low,
    pressed: elevationTokens.none,
    disabled: elevationTokens.none,
  },

  // Surfaces
  card: {
    rest: elevationTokens.low,
    hover: createElevation(3),
    pressed: createElevation(1),
  },

  // Floating elements
  fab: {
    rest: elevationTokens.medium,
    hover: createElevation(6, '#000', 0.2),
    pressed: createElevation(3),
  },

  // Overlay elements
  modal: {
    rest: elevationTokens.high,
    drawer: createElevation(12, '#000', 0.22),
  },

  // Dropdowns and menus
  menu: {
    rest: elevationTokens.medium,
    submenu: createElevation(6),
  },

  // Notifications and alerts
  toast: {
    rest: elevationTokens.high,
    hover: createElevation(10, '#000', 0.22),
  },

  // Form elements
  textField: {
    rest: elevationTokens.none,
    focus: elevationTokens.low,
    error: createElevation(2, '#DC2626', 0.15), // Using red for error states
  },
});

// Type exports
export type ElevationTokens = typeof elevationTokens;
export type SemanticElevation = ReturnType<typeof createSemanticElevation>;

// Helper function to get elevation style
export const getElevation = (level: keyof typeof elevationTokens) => elevationTokens[level];