/**
 * Backwards compatibility re-export
 *
 * Chat types were moved from src/types/chat.ts to src/features/chat/types.ts
 * This file exists to maintain backwards compatibility with existing imports and tests.
 *
 * New code should import directly from '@/src/features/chat/types'
 */
export * from '@/src/features/chat/types';
