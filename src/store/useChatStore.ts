/**
 * Backwards compatibility re-export
 *
 * The chat store was moved from src/store/useChatStore.ts to src/features/chat/store.ts
 * This file exists to maintain backwards compatibility with existing imports and tests.
 *
 * New code should import directly from '@/src/features/chat/store'
 */
export * from '@/src/features/chat/store';
