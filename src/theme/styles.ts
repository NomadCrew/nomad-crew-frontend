import type { ViewStyle, TextStyle } from 'react-native';
import type { Theme } from './types';

// Input states interface
interface InputState {
  idle: {
    container: ViewStyle;
    text: TextStyle;
  };
  focus: {
    container: ViewStyle;
    text: TextStyle;
  };
  error: {
    container: ViewStyle;
    text: TextStyle;
  };
  disabled: {
    container: ViewStyle;
    text: TextStyle;
  };
}

export interface InputStyleProps {
  container: ViewStyle;
  input: ViewStyle;
  text: TextStyle;
  label: TextStyle;
  helper: TextStyle;
  states: InputState;
}

// Button states interface
interface ButtonState {
  idle: ViewStyle;
  hover: ViewStyle;
  pressed: ViewStyle;
  disabled: ViewStyle;
}

export interface ButtonStyleProps {
  container: ViewStyle;
  text: TextStyle;
  loadingContainer: ViewStyle;
  states: ButtonState;
}

export const getInputStyles = (theme: Theme): InputStyleProps => {
  // Base input styles
  const baseInput: ViewStyle = {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.components.input.padding,
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.default,
  };

  // Input states
  const states: InputState = {
    idle: {
      container: baseInput,
      text: {
        color: theme.colors.content.primary,
      },
    },
    focus: {
      container: {
        ...baseInput,
        borderColor: theme.colors.primary.main,
        borderWidth: 2,
        backgroundColor: theme.colors.surface.variant,
        ...theme.elevation.textField.focus,
      },
      text: {
        color: theme.colors.content.primary,
      },
    },
    error: {
      container: {
        ...baseInput,
        borderColor: theme.colors.status.error.border,
        backgroundColor: theme.colors.status.error.surface,
      },
      text: {
        color: theme.colors.status.error.content,
      },
    },
    disabled: {
      container: {
        ...baseInput,
        backgroundColor: theme.colors.surface.variant,
        borderColor: theme.colors.border.default,
        opacity: 0.5,
      },
      text: {
        color: theme.colors.content.disabled,
      },
    },
  };

  return {
    container: {
      gap: theme.spacing.components.input.labelMargin,
      marginBottom: theme.spacing.components.input.marginBottom,
    },
    input: states.idle.container,
    text: states.idle.text,
    label: {
      ...theme.typography.input.label,
      color: theme.colors.content.secondary,
      marginBottom: theme.spacing.components.input.labelMargin,
    },
    helper: {
      ...theme.typography.input.helper,
      color: theme.colors.content.tertiary,
      marginTop: theme.spacing.components.input.helperTextMargin,
    },
    states,
  };
};

export const getButtonStyles = (theme: Theme, isLoading = false): ButtonStyleProps => {
  // Base button styles
  const baseButton: ViewStyle = {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.components.button.paddingHorizontal,
    backgroundColor: theme.colors.primary.main,
    ...theme.elevation.button.rest,
  };

  // Button states
  const states: ButtonState = {
    idle: {
      ...baseButton,
    },
    hover: {
      ...baseButton,
      backgroundColor: theme.colors.primary.hover,
      ...theme.elevation.button.rest,
    },
    pressed: {
      ...baseButton,
      backgroundColor: theme.colors.primary.pressed,
      transform: [{ scale: 0.98 }],
      ...theme.elevation.button.pressed,
    },
    disabled: {
      ...baseButton,
      backgroundColor: theme.colors.primary.disabled,
      opacity: 0.5,
      ...theme.elevation.button.disabled,
    },
  };

  return {
    container: {
      ...states.idle,
      opacity: isLoading ? 0.8 : 1,
    },
    text: {
      ...theme.typography.button.medium,
      color: theme.colors.primary.text,
      textAlign: 'center',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.components.button.gap,
    },
    states,
  };
};

// Helper to combine active states
export const combineStates = (base: ViewStyle, ...states: Partial<ViewStyle>[]) => {
  return states.reduce((acc, state) => ({
    ...acc,
    ...state,
  }), base);
};

// Input variant styles (can be expanded based on needs)
export const inputVariants = {
  outlined: 'outlined',
  filled: 'filled',
  underlined: 'underlined',
} as const;

// Button variant styles (can be expanded based on needs)
export const buttonVariants = {
  contained: 'contained',
  outlined: 'outlined',
  text: 'text',
} as const;

export type InputVariant = keyof typeof inputVariants;
export type ButtonVariant = keyof typeof buttonVariants;