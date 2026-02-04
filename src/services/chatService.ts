/**
 * Backwards compatibility re-export
 *
 * The chat service was moved from src/services/chatService.ts to src/features/chat/service.ts
 * This file exists to maintain backwards compatibility with existing imports and tests.
 *
 * New code should import directly from '@/src/features/chat/service'
 */
export * from '@/src/features/chat/service';
