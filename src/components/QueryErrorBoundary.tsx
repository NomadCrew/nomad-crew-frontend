import React, { ReactNode } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Query Error Boundary Component
 *
 * Wraps ErrorBoundary with TanStack Query's error reset functionality.
 * This allows queries to be automatically reset when the error boundary resets.
 *
 * @example
 * ```tsx
 * <QueryErrorBoundary>
 *   <YourQueryComponent />
 * </QueryErrorBoundary>
 * ```
 */
export function QueryErrorBoundary({ children, fallback, onError }: Props) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary fallback={fallback} onError={onError} onReset={reset}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
