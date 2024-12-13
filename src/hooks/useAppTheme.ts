import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '@/src/theme';

export function useAppTheme() {
    const colorScheme = useColorScheme();
    return colorScheme === 'dark' ? darkTheme : lightTheme;
  }
  
  export function useThemeColor(colorName: keyof typeof lightTheme.colors) {
    const theme = useAppTheme();
    return theme.colors[colorName];
  }
  
  export function useComponentStyles<T extends keyof typeof lightTheme.components>(
    componentName: T
  ) {
    const theme = useAppTheme();
    return theme.components[componentName];
  }