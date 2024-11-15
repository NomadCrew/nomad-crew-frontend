import { MD3LightTheme, configureFonts } from 'react-native-paper';

const palette = {
  orange: '#F46315',
  jet: '#2A2B2A',
  mint: '#61C9A8',
  thistle: '#D3C0CD',
  snow: '#FFFAFB',
  
  // Additional shades for the orange (primary color)
  orangeLight: '#FF8A4D',
  orangeDark: '#D14800',
  
  // Additional shades for mint (accent color)
  mintLight: '#7FDDC0',
  mintDark: '#44B68E',
  
  // Semantic colors
  error: '#DC3545',
  warning: '#FFC107',
  success: '#28A745',
  info: '#17A2B8',
};

const fontConfig = {
  displayLarge: {
    fontFamily: 'sans-serif',
    fontSize: 57,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'sans-serif',
    fontSize: 45,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'sans-serif',
    fontSize: 36,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 44,
  },
  bodyLarge: {
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  labelLarge: {
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
};

export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({config: fontConfig}),
  colors: {
    ...MD3LightTheme.colors,
    // Primary
    primary: palette.orange,
    primaryContainer: palette.orangeLight,
    onPrimary: palette.snow,
    onPrimaryContainer: palette.jet,
    
    // Secondary
    secondary: palette.mint,
    secondaryContainer: palette.mintLight,
    onSecondary: palette.jet,
    onSecondaryContainer: palette.jet,
    
    // Background
    background: palette.snow,
    onBackground: palette.jet,
    
    // Surface
    surface: palette.snow,
    onSurface: palette.jet,
    surfaceVariant: palette.thistle,
    onSurfaceVariant: palette.jet,
    
    // Error
    error: palette.error,
    onError: palette.snow,
    
    // Custom colors
    customColors: palette,
  },
  
  // Custom theme properties
  roundness: 8,
  animation: {
    scale: 1.0,
  },
};

// Type definitions
declare global {
  namespace ReactNativePaper {
    interface ThemeColors {
      customColors: typeof palette;
    }
  }
}

export type AppTheme = typeof theme;
export const useAppTheme = () => useTheme<AppTheme>();