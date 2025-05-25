import { useAppTheme } from '../ThemeProvider';
import { StylesFunction, StylesObject } from './createStyles';
import { useThemedStyles } from './useThemedStyles';

/**
 * Hook that provides both the theme and styles for components
 * 
 * @param stylesFunc Function that takes a theme and returns a styles object
 * @returns An object containing the theme and memoized styles
 * 
 * @example
 * const { theme, styles } = useThemeAndStyles((theme) => ({
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
 *   <Text style={styles.text}>
 *     {theme.mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
 *   </Text>
 * </View>
 */
export function useThemeAndStyles<T extends StylesObject>(
  stylesFunc: StylesFunction<T>
) {
  const themeContext = useAppTheme();
  const styles = useThemedStyles(stylesFunc);
  
  return {
    ...themeContext,
    styles,
  };
} 