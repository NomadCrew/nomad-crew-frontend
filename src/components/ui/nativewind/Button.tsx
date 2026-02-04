import React from 'react';
import { Text, Pressable, PressableProps, ViewStyle, TextStyle } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'flex flex-row items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white active:bg-primary-dark',
        secondary: 'bg-secondary text-white active:bg-secondary-dark',
        outline: 'border border-primary text-primary active:bg-primary/10',
        ghost: 'text-primary active:bg-primary/10',
        destructive: 'bg-error text-white active:bg-red-700',
      },
      size: {
        sm: 'px-3 py-1.5',
        md: 'px-4 py-2',
        lg: 'px-6 py-3',
        xl: 'px-8 py-4',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      fullWidth: false,
    },
  }
);

const textVariants = cva('text-center font-medium', {
  variants: {
    variant: {
      default: 'text-white',
      secondary: 'text-white',
      outline: 'text-primary',
      ghost: 'text-primary',
      destructive: 'text-white',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export interface ButtonProps
  extends PressableProps,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  variant,
  size,
  fullWidth,
  children,
  loading,
  icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}: ButtonProps) {
  const buttonClass = buttonVariants({ variant, size, fullWidth });
  const textClass = textVariants({ variant, size });
  
  return (
    <Pressable
      className={`${buttonClass} ${disabled || loading ? 'opacity-50' : ''} ${className || ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {icon && iconPosition === 'left' && <>{icon}</>}
      {typeof children === 'string' ? (
        <Text className={textClass}>{children}</Text>
      ) : (
        children
      )}
      {icon && iconPosition === 'right' && <>{icon}</>}
    </Pressable>
  );
}