import { useMemo } from 'react';
import { useTheme } from '../ThemeProvider';
import { StylesFunction, StylesObject } from './createStyles';

/**
 * Hook that combines useTheme and style creation for components
 * 
 * @param stylesFunc Function that takes a theme and returns a styles object
 * @returns An object containing the theme and memoized styles
 * 
 * @example
 * const styles = useThemedStyles((theme) => ({
 *   container: {
 *     backgroundColor: theme.colors.background.default,
 *     padding: theme.spacing.inset.md,
 *   },
 *   text: {
 *     color: theme.colors.content.primary,
 *     fontSize: theme.typography.size.md,
 *   },
 * }));
 * 
 * // In your JSX:
 * <View style={styles.container}>
 *   <Text style={styles.text}>Hello World</Text>
 * </View>
 */
export function useThemedStyles<T extends StylesObject>(
  stylesFunc: StylesFunction<T>
) {
  const { theme } = useTheme();
  
  // Memoize the styles to prevent unnecessary re-renders
  const styles = useMemo(() => stylesFunc(theme), [stylesFunc, theme]);
  
  return styles;
} 