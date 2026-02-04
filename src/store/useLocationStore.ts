/**
 * Backwards compatibility re-export
 *
 * The location store was moved from src/store/useLocationStore.ts to src/features/location/store/useLocationStore.ts
 * This file exists to maintain backwards compatibility with existing imports and tests.
 *
 * New code should import directly from '@/src/features/location/store/useLocationStore'
 */
export * from '@/src/features/location/store/useLocationStore';
