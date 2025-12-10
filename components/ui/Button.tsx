import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useThemedStyles } from '@/src/theme/utils';
import { useTheme as useThemeProvider } from '@/src/theme/ThemeProvider';

export type ButtonVariant = 'filled' | 'outlined' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /**
   * The label text of the button
   */
  label: string;

  /**
   * The variant of the button
   */
  variant?: ButtonVariant;

  /**
   * The size of the button
   */
  size?: ButtonSize;

  /**
   * Whether the button is in a loading state
   */
  loading?: boolean;

  /**
   * Whether the button is disabled
   */
  disabled?: boolean;

  /**
   * Whether the button should take up the full width of its container
   */
  fullWidth?: boolean;

  /**
   * Icon to display at the start of the button
   */
  startIcon?: React.ReactNode;

  /**
   * Icon to display at the end of the button
   */
  endIcon?: React.ReactNode;

  /**
   * Additional styles for the button container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Additional styles for the button text
   */
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Renders a themed, accessible button with variants, sizes, optional icons, and a loading state.
 *
 * Renders an ActivityIndicator in place of content when `loading` is true. `disabled` or `loading`
 * prevents presses. `fullWidth` expands the button to the container width. `startIcon` and
 * `endIcon` are rendered before and after the label, respectively. Visual styles are derived
 * from the active theme with safe fallbacks.
 *
 * @param label - The button text
 * @param variant - Visual style of the button; one of `'filled'`, `'outlined'`, or `'ghost'`
 * @param size - Size variant; one of `'sm'`, `'md'`, or `'lg'`
 * @param loading - Shows a spinner and disables interaction while `true`
 * @param disabled - Disables interaction and applies disabled styling when `true`
 * @param fullWidth - Expands the button to 100% width when `true`
 * @param startIcon - Node rendered to the left of the label
 * @param endIcon - Node rendered to the right of the label
 * @param style - Container style overrides
 * @param textStyle - Text style overrides for the label
 * @param onPress - Press handler
 * @returns The rendered button element
 */
export function Button({
  label,
  variant = 'filled',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  startIcon,
  endIcon,
  style,
  textStyle,
  onPress,
  ...rest
}: ButtonProps) {
  const { theme } = useThemeProvider();
  const _primaryHover = theme.colors.primary.hover;
  const _primarySurface = theme.colors.primary.surface;
  const _contentPrimary = theme.colors.content.primary;
  const _contentSecondary = theme.colors.content.secondary;
  const styles = useThemedStyles((theme) => {
    // Safely access theme properties with fallbacks
    const primaryColor = theme?.colors?.primary?.main || '#F46315';
    const primarySurface = theme?.colors?.primary?.surface || '#FFF7ED';
    const contentDisabled = theme?.colors?.content?.disabled || '#9CA3AF';
    const surfaceDefault = theme?.colors?.surface?.default || '#FFFFFF';
    const borderDefault = theme?.colors?.border?.default || '#E5E7EB';
    const borderRadius = theme?.borderRadius?.md || 8;

    // Size mappings
    const sizeMap = {
      sm: {
        height: 32,
        paddingHorizontal: 12,
        fontSize: theme?.typography?.size?.sm || 14,
        iconSize: 16,
      },
      md: {
        height: 40,
        paddingHorizontal: 16,
        fontSize: theme?.typography?.size?.md || 16,
        iconSize: 18,
      },
      lg: {
        height: 48,
        paddingHorizontal: 20,
        fontSize: theme?.typography?.size?.lg || 18,
        iconSize: 20,
      },
    };

    // Get colors based on variant and state
    const getBackgroundColor = () => {
      if (disabled) return theme?.colors?.disabled?.background || surfaceDefault;

      // Handle variant colors safely
      const variantColors = theme?.colors?.[variant as keyof typeof theme.colors];
      if (variantColors && typeof variantColors === 'object' && 'background' in variantColors) {
        return (variantColors as { background: string }).background;
      }
      return primarySurface;
    };

    const getBorderColor = () => {
      if (disabled) return theme?.colors?.disabled?.border || borderDefault;
      return variant === 'outlined' ? primaryColor : 'transparent';
    };

    const getTextColor = () => {
      if (disabled) return theme?.colors?.disabled?.text || contentDisabled;

      // Handle variant text colors safely
      const variantColors = theme?.colors?.[variant as keyof typeof theme.colors];
      if (variantColors && typeof variantColors === 'object' && 'text' in variantColors) {
        return (variantColors as { text: string }).text;
      }
      return primaryColor;
    };

    return {
      button: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        height: sizeMap[size].height,
        paddingHorizontal: sizeMap[size].paddingHorizontal,
        borderRadius: borderRadius,
        backgroundColor: getBackgroundColor(),
        borderWidth: variant === 'outlined' ? 1 : undefined,
        borderColor: getBorderColor(),
        opacity: loading ? 0.8 : 1,
        width: fullWidth ? ('100%' as const) : ('auto' as const),
      },
      label: {
        fontSize: sizeMap[size].fontSize,
        color: getTextColor(),
        fontWeight: '600' as const,
        textAlign: 'center' as const,
      },
      startIcon: {
        marginRight: 8,
      },
      endIcon: {
        marginLeft: 8,
      },
      loadingIndicator: {
        color: getTextColor(),
      },
    };
  });

  const isDisabled = disabled || loading;

  const getLoadingColor = () => {
    if (disabled) return styles.label.color;

    switch (variant) {
      case 'filled':
        return '#FFFFFF';
      case 'outlined':
      case 'ghost':
        return styles.label.color;
      default:
        return styles.label.color;
    }
  };

  const loadingSize = {
    sm: 16,
    md: 20,
    lg: 24,
  }[size];

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size={loadingSize} color={getLoadingColor()} />
      ) : (
        <>
          {startIcon && <View style={styles.startIcon}>{startIcon}</View>}
          <Text style={[styles.label, textStyle]} numberOfLines={1}>
            {label}
          </Text>
          {endIcon && <View style={styles.endIcon}>{endIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

export default React.memo(Button);
