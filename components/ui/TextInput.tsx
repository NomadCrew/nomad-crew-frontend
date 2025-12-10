import React, { useCallback, useMemo, useState, memo } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  Platform,
  StyleSheet,
  View,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

/**
 * PerformantTextInput - A high-performance TextInput component
 *
 * This component addresses common performance issues with React Native TextInput:
 * 1. Runs on native thread where possible
 * 2. Minimizes re-renders with proper memoization
 * 3. Handles style updates efficiently
 * 4. Optimizes event handlers
 */

export interface TextInputProps extends RNTextInputProps {
  /**
   * Custom container style
   */
  containerStyle?: ViewStyle;
}

/**
 * Render a themed, performance-optimized TextInput wrapped in a container.
 *
 * The input adapts visual styles from the current theme and updates its border color when focused.
 *
 * @returns A View containing a styled React Native TextInput configured for reduced JS work, improved typing performance, and theme-aware colors.
 */
function TextInputComponent({
  style,
  containerStyle,
  onChangeText,
  value,
  placeholder,
  ...rest
}: TextInputProps) {
  const theme = useAppTheme().theme;
  const [isFocused, setIsFocused] = useState(false);

  // Memoize the container style
  const containerStyles = useMemo(() => [styles.container, containerStyle], [containerStyle]);

  // Memoize the input style
  const inputStyles = useMemo(
    () => [
      styles.input,
      {
        color: theme.colors.content.onSurface,
        backgroundColor: theme.colors.surface.default,
        borderColor: isFocused ? theme.colors.primary.main : theme.colors.border.default,
      },
      style,
    ],
    [style, theme.colors, isFocused]
  );

  // Memoize event handlers with correct types
  const handleFocus = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(true);
      if (rest.onFocus) {
        rest.onFocus(e);
      }
    },
    [rest]
  );

  const handleBlur = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(false);
      if (rest.onBlur) {
        rest.onBlur(e);
      }
    },
    [rest]
  );

  const handleChangeText = useCallback(
    (text: string) => {
      if (onChangeText) {
        onChangeText(text);
      }
    },
    [onChangeText]
  );

  return (
    <View style={containerStyles}>
      <RNTextInput
        // Spread rest first so our explicit props take precedence
        {...rest}
        // Performance optimizations
        autoCapitalize={rest.autoCapitalize ?? 'none'}
        autoCorrect={rest.autoCorrect ?? false}
        spellCheck={rest.spellCheck ?? false}
        disableFullscreenUI={true}
        keyboardType={rest.keyboardType ?? 'default'}
        returnKeyType={rest.returnKeyType ?? 'done'}
        // Theme colors
        placeholderTextColor={theme.colors.border.default}
        selectionColor={theme.colors.primary.main}
        // Core props
        style={inputStyles}
        value={value}
        placeholder={placeholder}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        // Critical for improving typing performance
        showSoftInputOnFocus={true}
        caretHidden={false}
        // Improves input performance
        autoComplete="off"
        importantForAutofill="no"
      />
    </View>
  );
}

// Memoize the entire component to prevent unnecessary re-renders
export const TextInput = memo(TextInputComponent);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 5,
    ...Platform.select({
      // iOS specific optimizations
      ios: {
        paddingVertical: 14,
      },
      // Android specific optimizations
      android: {
        paddingVertical: 8,
        textAlignVertical: 'center',
      },
    }),
  },
});
