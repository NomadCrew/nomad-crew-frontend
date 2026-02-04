/**
 * Backwards compatibility re-export
 *
 * The WebSocketManager was moved from src/websocket/WebSocketManager.ts to src/features/websocket/WebSocketManager.ts
 * This file exists to maintain backwards compatibility with existing imports and tests.
 *
 * New code should import directly from '@/src/features/websocket/WebSocketManager'
 */
export * from '@/src/features/websocket/WebSocketManager';
