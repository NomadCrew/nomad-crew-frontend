import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Theme } from '../types';

/**
 * Type for style objects that can be created with StyleSheet.create
 */
export type StylesObject = StyleSheet.NamedStyles<any>;

/**
 * Type for style functions that take a theme and return a styles object
 */
export type StylesFunction<T extends StylesObject> = (theme: Theme) => T;

/**
 * Type for style properties that can be used in React Native
 */
export type StyleProp = ViewStyle | TextStyle | ImageStyle;

/**
 * Creates a memoized styles object from a function that takes a theme
 * 
 * @param createStylesFunc Function that takes a theme and returns a styles object
 * @returns A function that takes a theme and returns a memoized styles object
 * 
 * @example
 * const useStyles = createStyles((theme) => ({
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
 * // In your component:
 * const { theme } = useAppTheme();
 * const styles = useStyles(theme);
 */
export function createStyles<T extends StylesObject>(
  createStylesFunc: StylesFunction<T>
): StylesFunction<T> {
  // We're returning a function that will memoize the styles
  return (theme: Theme) => {
    // Create the styles object using StyleSheet.create for optimization
    return StyleSheet.create(createStylesFunc(theme));
  };
} 