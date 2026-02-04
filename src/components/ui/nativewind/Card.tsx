import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/src/lib/utils';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'bg-surface dark:bg-surface-dark rounded-lg p-4 shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <View className={cn('mb-2', className)} {...props}>
      {children}
    </View>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <Text
      className={cn(
        'text-lg font-heading font-semibold text-text-primary dark:text-text-primary-dark',
        className
      )}
    >
      {children}
    </Text>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <Text
      className={cn(
        'text-sm text-text-secondary dark:text-text-secondary-dark',
        className
      )}
    >
      {children}
    </Text>
  );
}

interface CardContentProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <View className={cn('', className)} {...props}>
      {children}
    </View>
  );
}

interface CardFooterProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <View className={cn('mt-4 flex-row', className)} {...props}>
      {children}
    </View>
  );
}