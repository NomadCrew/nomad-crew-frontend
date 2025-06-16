/**
 * Component utilities for enhanced theme system
 * Provides common styling patterns and utilities for UI components
 */

import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import type { Theme } from '../types';
import { safeThemeAccess } from '../utils';

/**
 * Create card component utilities
 */
export const createCardUtils = (theme: Theme) => ({
  /**
   * Basic card style with theme-aware colors
   */
  getCardStyle: (variant: 'default' | 'elevated' | 'outlined' = 'default'): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: safeThemeAccess.borderRadius.get(theme, 'lg', 12),
      padding: safeThemeAccess.spacing.get(theme, 'md', 16),
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: safeThemeAccess.colors.get(theme, 'surface.main', '#FFFFFF'),
          shadowColor: safeThemeAccess.colors.get(theme, 'content.primary', '#000000'),
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        };
      
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: safeThemeAccess.colors.get(theme, 'border.default', '#E5E7EB'),
        };
      
      default:
        return {
          ...baseStyle,
          backgroundColor: safeThemeAccess.colors.get(theme, 'surface.main', '#FFFFFF'),
        };
    }
  },

  /**
   * Card header style
   */
  getCardHeaderStyle: (): ViewStyle => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: safeThemeAccess.spacing.get(theme, 'sm', 8),
  }),

  /**
   * Card title style
   */
  getCardTitleStyle: (): TextStyle => ({
    fontSize: 18,
    fontWeight: '600',
    color: safeThemeAccess.colors.get(theme, 'content.primary', '#1A1A1A'),
  }),

  /**
   * Card content style
   */
  getCardContentStyle: (): ViewStyle => ({
    gap: safeThemeAccess.spacing.get(theme, 'sm', 8),
  }),
});

/**
 * Create button component utilities
 */
export const createButtonUtils = (theme: Theme) => ({
  /**
   * Button styles with semantic variants
   */
  getButtonStyle: (
    variant: 'primary' | 'secondary' | 'outlined' | 'ghost' = 'primary',
    size: 'sm' | 'md' | 'lg' = 'md'
  ): ViewStyle & TextStyle => {
    const sizeConfig = {
      sm: {
        paddingHorizontal: safeThemeAccess.spacing.get(theme, 'sm', 8),
        paddingVertical: safeThemeAccess.spacing.get(theme, 'xs', 4),
        fontSize: 14,
        borderRadius: safeThemeAccess.borderRadius.get(theme, 'sm', 4),
      },
      md: {
        paddingHorizontal: safeThemeAccess.spacing.get(theme, 'md', 16),
        paddingVertical: safeThemeAccess.spacing.get(theme, 'sm', 8),
        fontSize: 16,
        borderRadius: safeThemeAccess.borderRadius.get(theme, 'md', 8),
      },
      lg: {
        paddingHorizontal: safeThemeAccess.spacing.get(theme, 'lg', 24),
        paddingVertical: safeThemeAccess.spacing.get(theme, 'md', 16),
        fontSize: 18,
        borderRadius: safeThemeAccess.borderRadius.get(theme, 'lg', 12),
      },
    };

    const baseStyle = {
      ...sizeConfig[size],
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: safeThemeAccess.colors.get(theme, 'primary.main', '#F46315'),
          color: safeThemeAccess.colors.get(theme, 'primary.text', '#FFFFFF'),
        };
      
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: safeThemeAccess.colors.get(theme, 'surface.variant', '#F5F5F5'),
          color: safeThemeAccess.colors.get(theme, 'content.primary', '#1A1A1A'),
        };
      
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: safeThemeAccess.colors.get(theme, 'primary.main', '#F46315'),
          color: safeThemeAccess.colors.get(theme, 'primary.main', '#F46315'),
        };
      
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          color: safeThemeAccess.colors.get(theme, 'primary.main', '#F46315'),
        };
      
      default:
        return baseStyle;
    }
  },

  /**
   * Button disabled state
   */
  getDisabledButtonStyle: (): ViewStyle & TextStyle => ({
    backgroundColor: safeThemeAccess.colors.get(theme, 'disabled.background', '#E5E7EB'),
    color: safeThemeAccess.colors.get(theme, 'disabled.text', '#9CA3AF'),
    opacity: 0.6,
  }),
});

/**
 * Create list component utilities
 */
export const createListUtils = (theme: Theme) => ({
  /**
   * List container style
   */
  getListContainerStyle: (): ViewStyle => ({
    flex: 1,
    backgroundColor: safeThemeAccess.colors.get(theme, 'background.default', '#FFFFFF'),
  }),

  /**
   * List item style
   */
  getListItemStyle: (
    variant: 'default' | 'highlighted' | 'selected' = 'default'
  ): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      padding: safeThemeAccess.spacing.get(theme, 'md', 16),
      borderBottomWidth: 1,
      borderBottomColor: safeThemeAccess.colors.get(theme, 'border.default', '#E5E7EB'),
    };

    switch (variant) {
      case 'highlighted':
        return {
          ...baseStyle,
          backgroundColor: safeThemeAccess.colors.get(theme, 'primary.container', '#FFF7ED'),
        };
      
      case 'selected':
        return {
          ...baseStyle,
          backgroundColor: safeThemeAccess.colors.get(theme, 'primary.surface', '#FFF7ED'),
          borderLeftWidth: 4,
          borderLeftColor: safeThemeAccess.colors.get(theme, 'primary.main', '#F46315'),
        };
      
      default:
        return {
          ...baseStyle,
          backgroundColor: safeThemeAccess.colors.get(theme, 'surface.main', '#FFFFFF'),
        };
    }
  },

  /**
   * List section header style
   */
  getSectionHeaderStyle: (): ViewStyle => ({
    backgroundColor: safeThemeAccess.colors.get(theme, 'surface.variant', '#F5F5F5'),
    paddingHorizontal: safeThemeAccess.spacing.get(theme, 'md', 16),
    paddingVertical: safeThemeAccess.spacing.get(theme, 'sm', 8),
  }),

  /**
   * List section title style
   */
  getSectionTitleStyle: (): TextStyle => ({
    fontSize: 14,
    fontWeight: '600',
    color: safeThemeAccess.colors.get(theme, 'content.secondary', '#6B7280'),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }),
});

/**
 * Create input component utilities
 */
export const createInputUtils = (theme: Theme) => ({
  /**
   * Input container style
   */
  getInputContainerStyle: (
    state: 'default' | 'focused' | 'error' | 'disabled' = 'default'
  ): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderWidth: 1,
      borderRadius: safeThemeAccess.borderRadius.get(theme, 'md', 8),
      paddingHorizontal: safeThemeAccess.spacing.get(theme, 'md', 16),
      paddingVertical: safeThemeAccess.spacing.get(theme, 'sm', 8),
      backgroundColor: safeThemeAccess.colors.get(theme, 'surface.main', '#FFFFFF'),
    };

    switch (state) {
      case 'focused':
        return {
          ...baseStyle,
          borderColor: safeThemeAccess.colors.get(theme, 'primary.main', '#F46315'),
          borderWidth: 2,
        };
      
      case 'error':
        return {
          ...baseStyle,
          borderColor: safeThemeAccess.colors.get(theme, 'error.main', '#EF4444'),
          backgroundColor: safeThemeAccess.colors.get(theme, 'error.surface', '#FEF2F2'),
        };
      
      case 'disabled':
        return {
          ...baseStyle,
          borderColor: safeThemeAccess.colors.get(theme, 'disabled.border', '#E5E7EB'),
          backgroundColor: safeThemeAccess.colors.get(theme, 'disabled.background', '#F9FAFB'),
        };
      
      default:
        return {
          ...baseStyle,
          borderColor: safeThemeAccess.colors.get(theme, 'border.default', '#E5E7EB'),
        };
    }
  },

  /**
   * Input text style
   */
  getInputTextStyle: (
    state: 'default' | 'error' | 'disabled' = 'default'
  ): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 16,
      lineHeight: 24,
    };

    switch (state) {
      case 'error':
        return {
          ...baseStyle,
          color: safeThemeAccess.colors.get(theme, 'error.main', '#EF4444'),
        };
      
      case 'disabled':
        return {
          ...baseStyle,
          color: safeThemeAccess.colors.get(theme, 'disabled.text', '#9CA3AF'),
        };
      
      default:
        return {
          ...baseStyle,
          color: safeThemeAccess.colors.get(theme, 'content.primary', '#1A1A1A'),
        };
    }
  },

  /**
   * Input label style
   */
  getLabelStyle: (): TextStyle => ({
    fontSize: 14,
    fontWeight: '500',
    color: safeThemeAccess.colors.get(theme, 'content.secondary', '#6B7280'),
    marginBottom: safeThemeAccess.spacing.get(theme, 'xs', 4),
  }),

  /**
   * Input helper text style
   */
  getHelperTextStyle: (isError: boolean = false): TextStyle => ({
    fontSize: 12,
    color: isError 
      ? safeThemeAccess.colors.get(theme, 'error.main', '#EF4444')
      : safeThemeAccess.colors.get(theme, 'content.tertiary', '#9CA3AF'),
    marginTop: safeThemeAccess.spacing.get(theme, 'xs', 4),
  }),
});

/**
 * Hook to get all component utilities
 */
export const useComponentUtils = (theme: Theme) => ({
  card: createCardUtils(theme),
  button: createButtonUtils(theme),
  list: createListUtils(theme),
  input: createInputUtils(theme),
}); 