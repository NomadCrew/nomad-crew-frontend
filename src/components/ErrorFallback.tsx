import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Icon } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { ThemedText } from '@/src/components/ThemedText';

interface ErrorFallbackProps {
  error?: Error | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

/**
 * Renders a themed fallback UI for displaying an error with an optional retry action.
 *
 * Displays an icon, title, and message; in development it shows a truncated stack trace when available.
 *
 * @param error - The Error object to display details from; may be `null` or `undefined`.
 * @param title - Optional heading shown above the message. Defaults to "Something went wrong".
 * @param message - Optional message to display; if omitted the error's message or a generic message is used.
 * @param onRetry - Optional callback invoked when the user presses the retry button.
 * @param showRetryButton - When `true`, renders the retry button if `onRetry` is provided. Defaults to `true`.
 */
export function ErrorFallback({
  error,
  title = 'Something went wrong',
  message,
  onRetry,
  showRetryButton = true,
}: ErrorFallbackProps) {
  const { theme } = useAppTheme();

  const displayMessage =
    message || error?.message || 'An unexpected error occurred. Please try again.';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface.default }]}>
      <View style={styles.content}>
        {/* Error Icon */}
        <View
          style={[styles.iconContainer, { backgroundColor: theme.colors.status.error.surface }]}
        >
          <Icon source="alert-circle-outline" size={48} color={theme.colors.status.error.content} />
        </View>

        {/* Title */}
        <ThemedText variant="heading.h2" style={styles.title}>
          {title}
        </ThemedText>

        {/* Message */}
        <ThemedText variant="body.medium" color="content.secondary" style={styles.message}>
          {displayMessage}
        </ThemedText>

        {/* Error details in development mode */}
        {__DEV__ && error?.stack && (
          <View style={[styles.debugContainer, { backgroundColor: theme.colors.surface.variant }]}>
            <ThemedText variant="body.small" color="content.tertiary" style={styles.debugTitle}>
              Debug Info:
            </ThemedText>
            <ThemedText
              variant="body.small"
              color="content.tertiary"
              style={styles.debugText}
              numberOfLines={5}
            >
              {error.stack}
            </ThemedText>
          </View>
        )}

        {/* Retry Button */}
        {showRetryButton && onRetry && (
          <Button mode="contained" onPress={onRetry} style={styles.button} icon="refresh">
            Try Again
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    marginBottom: 24,
    textAlign: 'center',
  },
  debugContainer: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontFamily: 'monospace',
  },
  button: {
    minWidth: 150,
  },
});
