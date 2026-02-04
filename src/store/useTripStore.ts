/**
 * Backwards compatibility re-export
 *
 * The trip store was moved from src/store/useTripStore.ts to src/features/trips/store.ts
 * This file exists to maintain backwards compatibility with existing imports and tests.
 *
 * New code should import directly from '@/src/features/trips/store'
 */
export * from '@/src/features/trips/store';
