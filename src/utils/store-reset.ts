/**
 * Centralized store reset registry.
 * Each store registers a reset function called on logout
 * to prevent data leakage between user sessions.
 */

type ResetFunction = () => void;

const resetFunctions: Map<string, ResetFunction> = new Map();

export function registerStoreReset(storeName: string, resetFn: ResetFunction) {
  resetFunctions.set(storeName, resetFn);
}

export function resetAllStores() {
  resetFunctions.forEach((resetFn, storeName) => {
    try {
      resetFn();
    } catch (error) {
      console.warn(`[store-reset] Failed to reset store: ${storeName}`, error);
    }
  });
}
