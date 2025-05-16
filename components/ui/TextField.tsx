import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { useThemedStyles } from '@/src/theme/utils';
import { Ionicons } from '@expo/vector-icons';

export type TextFieldVariant = 'outlined' | 'filled';
export type TextFieldSize = 'sm' | 'md' | 'lg';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  /**
   * The label for the text field
   */
  label?: string;
  
  /**
   * Helper text to display below the text field
   */
  helperText?: string;
  
  /**
   * Error message to display below the text field
   */
  error?: string;
  
  /**
   * The variant of the text field
   */
  variant?: TextFieldVariant;
  
  /**
   * The size of the text field
   */
  size?: TextFieldSize;
  
  /**
   * Whether the text field is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether the text field is required
   */
  required?: boolean;
  
  /**
   * Icon to display at the start of the text field
   */
  startIcon?: React.ReactNode;
  
  /**
   * Icon to display at the end of the text field
   */
  endIcon?: React.ReactNode;
  
  /**
   * Whether to show a clear button when text is entered
   */
  clearable?: boolean;
  
  /**
   * Whether to show a password toggle button for password fields
   */
  passwordToggle?: boolean;
  
  /**
   * Additional styles for the text field container
   */
  containerStyle?: StyleProp<ViewStyle>;
  
  /**
   * Additional styles for the text field input
   */
  inputStyle?: StyleProp<TextStyle>;
  
  /**
   * Additional styles for the text field label
   */
  labelStyle?: StyleProp<TextStyle>;
  
  /**
   * Additional styles for the helper text
   */
  helperTextStyle?: StyleProp<TextStyle>;
}

/**
 * TextField component for text input
 */
export function TextField({
  label,
  helperText,
  error,
  variant = 'outlined',
  size = 'md',
  disabled = false,
  required = false,
  startIcon,
  endIcon,
  clearable = false,
  passwordToggle = false,
  containerStyle,
  inputStyle,
  labelStyle,
  helperTextStyle,
  value,
  onChangeText,
  secureTextEntry,
  ...rest
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const styles = useThemedStyles((theme) => {
    // Safely access theme properties with fallbacks
    const primaryColor = theme?.colors?.primary?.main || '#F46315';
    const contentPrimary = theme?.colors?.content?.primary || '#1A1A1A';
    const contentSecondary = theme?.colors?.content?.secondary || '#6B7280';
    const contentDisabled = theme?.colors?.content?.disabled || '#9CA3AF';
    const surfaceDefault = theme?.colors?.surface?.default || '#FFFFFF';
    const surfaceVariant = theme?.colors?.surface?.variant || '#F3F4F6';
    const borderDefault = theme?.colors?.border?.default || '#E5E7EB';
    const errorColor = theme?.colors?.error?.main || '#EF4444';
    const borderRadius = theme?.borderRadius?.md || 8;
    
    // Size mappings
    const sizeMap = {
      sm: {
        height: 36,
        paddingHorizontal: 12,
        fontSize: theme?.typography?.size?.sm || 14,
        labelSize: theme?.typography?.size?.xs || 12,
        helperTextSize: theme?.typography?.size?.xs || 12,
        iconSize: 16,
      },
      md: {
        height: 44,
        paddingHorizontal: 16,
        fontSize: theme?.typography?.size?.md || 16,
        labelSize: theme?.typography?.size?.sm || 14,
        helperTextSize: theme?.typography?.size?.xs || 12,
        iconSize: 18,
      },
      lg: {
        height: 52,
        paddingHorizontal: 16,
        fontSize: theme?.typography?.size?.lg || 18,
        labelSize: theme?.typography?.size?.md || 16,
        helperTextSize: theme?.typography?.size?.sm || 14,
        iconSize: 20,
      },
    };
    
    // Get border color based on state
    const getBorderColor = () => {
      if (error) return errorColor;
      if (isFocused) return primaryColor;
      return borderDefault;
    };
    
    // Get background color based on variant and state
    const getBackgroundColor = () => {
      if (disabled) return surfaceVariant;
      if (variant === 'filled') return surfaceVariant;
      return surfaceDefault;
    };
    
    return {
      container: {
        width: '100%' as const,
      },
      inputContainer: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        height: sizeMap[size].height,
        borderWidth: variant === 'outlined' ? 1 : 0,
        borderColor: getBorderColor(),
        borderRadius: borderRadius,
        backgroundColor: getBackgroundColor(),
        paddingHorizontal: sizeMap[size].paddingHorizontal,
        ...(variant === 'filled' && {
          borderBottomWidth: 1,
          borderBottomColor: getBorderColor(),
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }),
      },
      label: {
        fontSize: sizeMap[size].labelSize,
        color: error ? errorColor : contentSecondary,
        marginBottom: 4,
        fontWeight: '500' as const,
      },
      requiredStar: {
        color: errorColor,
      },
      input: {
        flex: 1,
        fontSize: sizeMap[size].fontSize,
        color: disabled ? contentDisabled : contentPrimary,
        height: sizeMap[size].height,
        paddingVertical: 0,
      },
      helperText: {
        fontSize: sizeMap[size].helperTextSize,
        color: error ? errorColor : contentSecondary,
        marginTop: 4,
      },
      startIcon: {
        marginRight: 8,
      },
      endIcon: {
        marginLeft: 8,
      },
      clearButton: {
        padding: 4,
      },
      passwordToggle: {
        padding: 4,
      },
    };
  });
  
  const handleFocus = () => {
    setIsFocused(true);
    if (rest.onFocus) {
      const event = { nativeEvent: { text: value } };
      rest.onFocus(event as any);
    }
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    if (rest.onBlur) {
      const event = { nativeEvent: { text: value } };
      rest.onBlur(event as any);
    }
  };
  
  const handleClear = () => {
    if (onChangeText) {
      onChangeText('');
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const iconSize = {
    sm: 16,
    md: 18,
    lg: 20,
  }[size];
  
  const isPasswordField = secureTextEntry || passwordToggle;
  const shouldShowPasswordToggle = isPasswordField && passwordToggle;
  const shouldShowClearButton = clearable && value && value.length > 0 && !disabled;
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
      )}
      
      <View style={styles.inputContainer}>
        {startIcon && <View style={styles.startIcon}>{startIcon}</View>}
        
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          secureTextEntry={isPasswordField && !showPassword}
          placeholderTextColor={styles.helperText.color}
          {...rest}
        />
        
        {shouldShowClearButton && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Ionicons name="close-circle" size={iconSize} color={styles.helperText.color} />
          </TouchableOpacity>
        )}
        
        {shouldShowPasswordToggle && (
          <TouchableOpacity style={styles.passwordToggle} onPress={togglePasswordVisibility}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={iconSize}
              color={styles.helperText.color}
            />
          </TouchableOpacity>
        )}
        
        {endIcon && <View style={styles.endIcon}>{endIcon}</View>}
      </View>
      
      {(helperText || error) && (
        <Text style={[styles.helperText, helperTextStyle]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

export default React.memo(TextField); 