import { renderHook } from '@testing-library/react-native';
import { useCancellableRequest } from '../../src/hooks/useCancellableRequest';

describe('useCancellableRequest', () => {
  describe('getSignal', () => {
    it('should return an AbortSignal', () => {
      const { result } = renderHook(() => useCancellableRequest());

      const signal = result.current.getSignal();

      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(false);
    });

    it('should return a fresh signal each time getSignal is called', () => {
      const { result } = renderHook(() => useCancellableRequest());

      const signal1 = result.current.getSignal();
      const signal2 = result.current.getSignal();

      expect(signal1).not.toBe(signal2);
      expect(signal1).toBeInstanceOf(AbortSignal);
      expect(signal2).toBeInstanceOf(AbortSignal);
    });

    it('should abort previous signal when getSignal is called again', () => {
      const { result } = renderHook(() => useCancellableRequest());

      const signal1 = result.current.getSignal();
      expect(signal1.aborted).toBe(false);

      const signal2 = result.current.getSignal();
      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(false);
    });

    it('should abort multiple previous signals', () => {
      const { result } = renderHook(() => useCancellableRequest());

      const signal1 = result.current.getSignal();
      const signal2 = result.current.getSignal();
      const signal3 = result.current.getSignal();

      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(true);
      expect(signal3.aborted).toBe(false);
    });
  });

  describe('cleanup on unmount', () => {
    it('should abort signal when component unmounts', () => {
      const { result, unmount } = renderHook(() => useCancellableRequest());

      const signal = result.current.getSignal();
      expect(signal.aborted).toBe(false);

      unmount();

      expect(signal.aborted).toBe(true);
    });

    it('should abort the most recent signal on unmount', () => {
      const { result, unmount } = renderHook(() => useCancellableRequest());

      const signal1 = result.current.getSignal();
      const signal2 = result.current.getSignal();

      // signal1 is already aborted by signal2
      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(false);

      unmount();

      // signal2 should now be aborted
      expect(signal2.aborted).toBe(true);
    });

    it('should handle unmount when no signal was created', () => {
      const { unmount } = renderHook(() => useCancellableRequest());

      // Should not throw an error
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('signal stability', () => {
    it('should maintain the same getSignal function reference', () => {
      const { result, rerender } = renderHook(() => useCancellableRequest());

      const getSignal1 = result.current.getSignal;
      rerender({});
      const getSignal2 = result.current.getSignal;

      expect(getSignal1).toBe(getSignal2);
    });
  });

  describe('concurrent requests simulation', () => {
    it('should cancel first request when second request is initiated', async () => {
      const { result } = renderHook(() => useCancellableRequest());

      // Simulate first request
      const signal1 = result.current.getSignal();
      const request1Cancelled = jest.fn();

      signal1.addEventListener('abort', request1Cancelled);

      // Simulate second request (should cancel first)
      const signal2 = result.current.getSignal();

      expect(request1Cancelled).toHaveBeenCalled();
      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(false);
    });

    it('should handle rapid consecutive calls', () => {
      const { result } = renderHook(() => useCancellableRequest());

      const signals = [];
      for (let i = 0; i < 5; i++) {
        signals.push(result.current.getSignal());
      }

      // All except the last one should be aborted
      for (let i = 0; i < 4; i++) {
        expect(signals[i]?.aborted).toBe(true);
      }
      expect(signals[4]?.aborted).toBe(false);
    });
  });

  describe('abort event handling', () => {
    it('should trigger abort event listeners when signal is cancelled', () => {
      const { result } = renderHook(() => useCancellableRequest());

      const signal = result.current.getSignal();
      const abortHandler = jest.fn();
      signal.addEventListener('abort', abortHandler);

      // Trigger abort by getting a new signal
      result.current.getSignal();

      expect(abortHandler).toHaveBeenCalled();
    });

    it('should not trigger abort event on already aborted signal', () => {
      const { result } = renderHook(() => useCancellableRequest());

      const signal1 = result.current.getSignal();
      const abortHandler = jest.fn();

      // Create a new signal which aborts signal1
      result.current.getSignal();

      // Now add listener to already aborted signal
      signal1.addEventListener('abort', abortHandler);

      // Create another signal
      result.current.getSignal();

      // The handler should not be called again since signal1 was already aborted
      // Note: This tests implementation detail - abort event fires once
      expect(abortHandler).not.toHaveBeenCalled();
    });
  });

  describe('real-world usage patterns', () => {
    it('should work with fetch API pattern', async () => {
      const { result, unmount } = renderHook(() => useCancellableRequest());

      const signal = result.current.getSignal();

      // Simulate a fetch call that gets cancelled
      const mockFetch = jest.fn();
      mockFetch.mockImplementation(() => {
        return new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      });

      const fetchPromise = mockFetch({ signal });

      // Unmount should cancel the request
      unmount();

      await expect(fetchPromise).rejects.toThrow('The operation was aborted.');
    });

    it('should allow sequential requests to complete', async () => {
      const { result } = renderHook(() => useCancellableRequest());

      // First request
      const signal1 = result.current.getSignal();
      const mockFetch1 = jest.fn().mockResolvedValue({ data: 'response1' });
      const promise1 = mockFetch1({ signal: signal1 });

      await promise1;
      expect(mockFetch1).toHaveBeenCalledWith({ signal: signal1 });

      // Second request (first signal should be aborted, but response already came back)
      const signal2 = result.current.getSignal();
      const mockFetch2 = jest.fn().mockResolvedValue({ data: 'response2' });
      const promise2 = mockFetch2({ signal: signal2 });

      await promise2;
      expect(mockFetch2).toHaveBeenCalledWith({ signal: signal2 });

      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(false);
    });
  });
});
