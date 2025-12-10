import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Icon } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';

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
        <Text style={[styles.title, { color: theme.colors.content.primary }]}>{title}</Text>

        {/* Message */}
        <Text style={[styles.message, { color: theme.colors.content.secondary }]}>
          {displayMessage}
        </Text>

        {/* Error details in development mode */}
        {__DEV__ && error?.stack && (
          <View style={[styles.debugContainer, { backgroundColor: theme.colors.surface.variant }]}>
            <Text style={[styles.debugTitle, { color: theme.colors.content.tertiary }]}>
              Debug Info:
            </Text>
            <Text
              style={[styles.debugText, { color: theme.colors.content.tertiary }]}
              numberOfLines={5}
            >
              {error.stack}
            </Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  debugContainer: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  button: {
    minWidth: 150,
  },
});