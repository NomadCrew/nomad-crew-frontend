/**
 * Backwards compatibility re-export
 *
 * The auth store was moved from src/store/useAuthStore.ts to src/features/auth/store.ts
 * This file exists to maintain backwards compatibility with existing imports and tests.
 *
 * New code should import directly from '@/src/features/auth/store'
 */
export * from '@/src/features/auth/store';
