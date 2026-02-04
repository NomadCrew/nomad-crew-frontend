/**
 * Backwards compatibility re-export
 *
 * Auth types were moved from src/types/auth.ts to src/features/auth/types.ts
 * This file exists to maintain backwards compatibility with existing imports and tests.
 *
 * New code should import directly from '@/src/features/auth/types'
 */
export * from '@/src/features/auth/types';
