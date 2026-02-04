import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { cn } from '@/src/lib/utils';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  containerClassName,
  ...props
}: InputProps) {
  const hasError = !!error;
  
  return (
    <View className={cn('mb-4', containerClassName)}>
      {label && (
        <Text className="text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">
          {label}
        </Text>
      )}
      
      <View
        className={cn(
          'flex-row items-center bg-background dark:bg-background-dark rounded-md border',
          hasError 
            ? 'border-error' 
            : 'border-gray-300 dark:border-gray-600 focus:border-primary',
          'px-3 py-2'
        )}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        
        <TextInput
          className={cn(
            'flex-1 text-text-primary dark:text-text-primary-dark',
            'text-base',
            className
          )}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
      
      {error && (
        <Text className="text-sm text-error mt-1">{error}</Text>
      )}
      
      {helperText && !error && (
        <Text className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">
          {helperText}
        </Text>
      )}
    </View>
  );
}