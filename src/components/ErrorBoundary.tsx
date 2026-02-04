import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Button } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  theme?: Theme;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic Error Boundary Component
 *
 * Catches React component errors and displays a fallback UI.
 * Can be configured with custom fallback components and error handlers.
 *
 * @example
 * ```tsx
 * <ErrorBoundary onError={(error) => logToService(error)}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    const { onReset } = this.props;

    // Reset error state
    this.setState({ hasError: false, error: null });

    // Call custom reset handler if provided
    onReset?.();
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, theme } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Get theme-aware styles
      const themedStyles = getThemedStyles(theme);

      // Default fallback UI
      return (
        <View style={themedStyles.container}>
          <View style={themedStyles.content}>
            <Text style={themedStyles.title}>Oops! Something went wrong</Text>
            <Text style={themedStyles.message}>
              {error?.message || 'An unexpected error occurred'}
            </Text>
            <Button mode="contained" onPress={this.handleRetry} style={themedStyles.button}>
              Try Again
            </Button>
          </View>
        </View>
      );
    }

    return children;
  }
}

// Theme-aware styles with fallbacks
const getThemedStyles = (theme?: Theme) => {
  const backgroundColor = theme?.colors.background.default ?? '#ffffff';
  const primaryColor = theme?.colors.content.primary ?? '#1a1a1a';
  const secondaryColor = theme?.colors.content.secondary ?? '#666666';
  const padding = theme?.spacing.inset.lg ?? 24;
  const marginBottom = theme?.spacing.stack.md ?? 16;
  const marginBottomLarge = theme?.spacing.stack.lg ?? 24;

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: padding,
      backgroundColor: backgroundColor,
    },
    content: {
      maxWidth: 400,
      width: '100%',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: primaryColor,
      marginBottom: marginBottom,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: secondaryColor,
      marginBottom: marginBottomLarge,
      textAlign: 'center',
      lineHeight: 24,
    },
    button: {
      minWidth: 150,
    },
  });
};

// Wrapper component to inject theme into class component
export const ThemedErrorBoundary: React.FC<Omit<Props, 'theme'>> = (props) => {
  const { theme } = useAppTheme();
  return <ErrorBoundary {...props} theme={theme} />;
};
