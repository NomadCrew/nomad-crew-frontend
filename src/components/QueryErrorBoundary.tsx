import React, { ReactNode } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Composes TanStack Query's QueryErrorResetBoundary with the local ErrorBoundary to reset queries when the boundary resets.
 *
 * Renders a QueryErrorResetBoundary and forwards its `reset` callback to ErrorBoundary's `onReset`, passing through `fallback`, `onError`, and `children`.
 *
 * @returns The rendered boundary component that resets related queries when the error boundary is reset.
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