import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, Button } from 'react-native-paper';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';

interface Props {
  children: React.ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class TodoErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('Todo component error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return <TodoErrorFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

const TodoErrorFallback = ({ onRetry }: { onRetry: () => void }) => {
  const { theme } = useTheme();
  
  return (
    <Surface style={styles(theme).container}>
      <Text style={styles(theme).title}>Oops! Something went wrong</Text>
      <Text style={styles(theme).message}>
        We're having trouble loading your todos
      </Text>
      <Button
        mode="contained"
        onPress={onRetry}
        style={styles(theme).button}
      >
        Try Again
      </Button>
    </Surface>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    padding: theme.spacing.inset.lg,
    borderRadius: theme.spacing.inset.md,
    alignItems: 'center',
    backgroundColor: theme.colors.surface.variant,
  },
  title: {
    ...theme.typography.heading.h6,
    color: theme.colors.content.primary,
    marginBottom: theme.spacing.stack.sm,
  },
  message: {
    ...theme.typography.body.medium,
    color: theme.colors.content.secondary,
    marginBottom: theme.spacing.stack.lg,
  },
  button: {
    minWidth: 120,
  },
});