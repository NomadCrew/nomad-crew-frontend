/**
 * Backwards compatibility re-export
 *
 * Trip types were moved from src/types/trip.ts to src/features/trips/types.ts
 * This file exists to maintain backwards compatibility with existing imports and tests.
 *
 * New code should import directly from '@/src/features/trips/types'
 */
export * from '@/src/features/trips/types';
