import { useWindowDimensions } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  
  return {
    isTablet: width >= theme.breakpoints.tablet,
    isDesktop: width >= theme.breakpoints.desktop,
    containerWidth: Math.min(width, theme.breakpoints.desktop),
    gridColumns: width >= theme.breakpoints.tablet ? 2 : 1,
    contentPadding: theme.spacing.layout.screen.padding,
  };
}