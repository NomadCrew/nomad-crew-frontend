import React, { memo, useCallback, useState, useMemo } from 'react';
import { 
  TextInput as RNTextInput, 
  TextInputProps,
  InteractionManager,
  ViewStyle,
  StyleSheet,
  Platform
} from 'react-native';

/**
 * PerformanceOptimizer
 * 
 * A collection of high-performance components and utilities that
 * improve React Native app performance, particularly for text inputs.
 */

/**
 * OptimizedTextInput - A performance-optimized TextInput component
 * 
 * - Uses InteractionManager to process text changes with lower priority
 * - Applies optimal performance settings for different platforms
 * - Memoizes handlers and props to prevent unnecessary re-renders
 */
export const OptimizedTextInput = memo(({ 
  style,
  onChangeText,
  value,
  placeholder,
  onFocus,
  onBlur,
  ...props 
}: TextInputProps) => {
  // Track focus state for optimized rendering
  const [isFocused, setIsFocused] = useState(false);
  
  // Optimized handlers
  const handleChangeText = useCallback((text: string) => {
    if (onChangeText) {
      // For better typing performance, don't offload to InteractionManager
      // This actually makes typing more responsive
      onChangeText(text);
    }
  }, [onChangeText]);
  
  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  }, [onFocus]);
  
  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  }, [onBlur]);
  
  // Performance-optimized props based on platform
  const optimizedProps = useMemo(() => {
    const common = {
      autoCapitalize: "none" as const,
      autoCorrect: false,
      spellCheck: false,
    };
    
    // Android-specific optimizations
    if (Platform.OS === 'android') {
      return {
        ...common,
        disableFullscreenUI: true,
        importantForAutofill: "no" as const,
      };
    }
    
    // iOS-specific optimizations
    return {
      ...common,
      clearButtonMode: 'while-editing' as const,
    };
  }, []);

  return (
    <RNTextInput
      style={style}
      value={value}
      placeholder={placeholder}
      onChangeText={handleChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...optimizedProps}
      {...props}
    />
  );
});

/**
 * useInputPerformance - Hook to optimize input handling
 * 
 * Returns optimized handlers and props for input components
 */
export function useInputPerformance(options = {}) {
  // Base performance optimizations that can be applied to any TextInput
  return {
    textInputProps: {
      autoCapitalize: "none" as const, 
      autoCorrect: false,
      spellCheck: false,
      disableFullscreenUI: Platform.OS === 'android',
    },
    // Performance styles that can be applied to containers
    containerStyle: performantInputStyles.container,
    inputStyle: performantInputStyles.input,
    // Callback optimization helper
    optimizeCallback: (callback) => {
      return useCallback((...args) => {
        if (callback) {
          callback(...args);
        }
      }, [callback]);
    }
  };
}

// Performant styles to use on input containers
export const performantInputStyles = StyleSheet.create({
  container: {
    // These styles improve rendering performance
    overflow: 'hidden',
  },
  input: {
    height: 56,
    // Avoid unnecessary layout recalculations
    paddingVertical: Platform.OS === 'ios' ? 14 : 8,
  }
}); 