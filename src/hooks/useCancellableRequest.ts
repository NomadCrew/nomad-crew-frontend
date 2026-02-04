import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to manage request cancellation using AbortController.
 *
 * This hook provides a way to cancel in-flight HTTP requests when a component
 * unmounts or when a new request is initiated, preventing race conditions and
 * memory leaks from outdated requests.
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { getSignal } = useCancellableRequest();
 *
 *   const fetchData = async () => {
 *     try {
 *       const response = await apiClient.get('/endpoint', {
 *         signal: getSignal()
 *       });
 *       // Handle response
 *     } catch (error) {
 *       if (error.name === 'AbortError') {
 *         // Request was cancelled
 *         return;
 *       }
 *       // Handle other errors
 *     }
 *   };
 *
 *   return <Button onPress={fetchData}>Fetch</Button>;
 * }
 * ```
 *
 * @note When using with TanStack Query, signal is passed automatically.
 * TanStack Query handles cancellation internally when queries are invalidated
 * or components unmount, so this hook is primarily useful for standalone API calls.
 *
 * @returns Object containing getSignal function to retrieve an AbortSignal
 */
export function useCancellableRequest() {
  const controllerRef = useRef<AbortController | null>(null);

  /**
   * Returns a fresh AbortSignal for a new request.
   * Automatically cancels any previous in-flight request.
   */
  const getSignal = useCallback((): AbortSignal => {
    // Cancel previous request if it exists
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    // Create new controller for this request
    controllerRef.current = new AbortController();
    return controllerRef.current.signal;
  }, []);

  // Cleanup: cancel any in-flight requests when component unmounts
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  return { getSignal };
}
