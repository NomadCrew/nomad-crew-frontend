# WebSocket Architecture Review

**Date:** 2026-02-14
**Scope:** NomadCrew React Native frontend WebSocket event handling
**Status:** Proposed refactoring plan

---

## 1. Current Architecture

### Event Flow Overview

```
  Backend (Go WS server)
         |
         v
  WebSocketConnection          (raw WS, parses JSON, validates with isServerEvent)
         |
         v
  WebSocketManager.connect()   (singleton, wraps caller's onMessage callback)
    |         |         |
    v         v         v
  Location  Chat      Poll     (store handlers called directly by WSocketManager)
  Store     Store     queries
    |         |
    v         v
  Notification Store            (also handled in the wrappedCallbacks)
         |
         v
  callbacks?.onMessage?.(...)   (passes event to CALLER's original onMessage)
         |
    +---------+---------+
    |                   |
    v                   v
  TripDetailScreen     Chat Store's connectToChat
  (onMessage)          (onMessage)
    |                      |
    v                      v
  useTripStore         useChatStore
  .handleTripEvent     .handleChatEvent
  + useChatStore       (again)
  .handleChatEvent
  + notification
    fallback
```

### How Connections Are Established

1. **TripDetailScreen** mounts and calls `WebSocketManager.connect(tripId, { onMessage: ... })` at `TripDetailScreen.tsx:178`.
2. Immediately after, `connectToChat(tripId)` is called at `TripDetailScreen.tsx:252`.
3. `connectToChat` internally calls `WebSocketManager.connect(tripId, { onMessage: ... })` at `chat/store.ts:172`.
4. Because the manager is already connected to the same tripId, it hits the early-return path at `WebSocketManager.ts:66-68` and calls `updateCallbacks()`.
5. `WebSocketConnection.updateCallbacks()` at `WebSocketConnection.ts:249-251` does a **shallow merge**, replacing the `onMessage` callback with the chat store's version.

---

## 2. Issues (Ranked by Severity)

### CRITICAL: Callback Overwrite Causes Lost Events

**Description:** When `connectToChat()` is called after `TripDetailScreen`'s `connect()`, the shallow merge in `updateCallbacks()` replaces the TripDetailScreen's `onMessage` with the chat store's `onMessage`. The TripDetailScreen's callback -- which feeds `useTripStore.handleTripEvent()` for trip updates, weather, todos, and member events -- is silently discarded.

**Impact:** Trip updates (`TRIP_UPDATED`), weather updates (`WEATHER_UPDATED`), todo events (`TODO_CREATED`, `TODO_UPDATED`, `TODO_DELETED`), and member events (`MEMBER_ADDED`, `MEMBER_REMOVED`, `MEMBER_ROLE_UPDATED`) may never reach their respective handlers while the user is on the trip detail screen. The UI could show stale data with no indication of failure.

**Evidence:**

- `WebSocketManager.ts:65-68` -- early return path when already connected, calls `updateCallbacks`
- `WebSocketConnection.ts:249-251` -- `updateCallbacks` does `this.callbacks = { ...this.callbacks, ...callbacks }`, last writer wins for `onMessage`
- `TripDetailScreen.tsx:178` -- first connect call with trip event handler
- `chat/store.ts:172` -- second connect call that overwrites the callback
- `TripDetailScreen.tsx:252` -- `connectToChat(tripId)` called right after `manager.connect()`

**Severity:** CRITICAL -- silent data loss, no error reported

---

### HIGH: Duplicate Event Processing (Up to 3x)

**Description:** Chat events are processed by multiple handlers simultaneously. The `WebSocketManager`'s `wrappedCallbacks.onMessage` calls `this.handleChatEvent()` directly (`WebSocketManager.ts:141-143`), then passes the event to the caller's `onMessage` callback (`WebSocketManager.ts:151`). If TripDetailScreen's callback is active, it also calls `useChatStore.getState().handleChatEvent()` (`TripDetailScreen.tsx:189`). If the chat store's `connectToChat` callback is active, it calls `handleChatEvent` a third time (`chat/store.ts:161`).

**Impact:** Messages may appear duplicated in the UI. State updates fire multiple times, causing unnecessary re-renders and potential race conditions in optimistic updates.

**Evidence:**

- `WebSocketManager.ts:141-143` -- `handleChatEvent` called directly
- `WebSocketManager.ts:151` -- event forwarded to caller's `onMessage`
- `TripDetailScreen.tsx:188-189` -- `isChatEvent` check then `handleChatEvent`
- `chat/store.ts:156-163` -- `connectToChat`'s callback also calls `handleChatEvent`

**Severity:** HIGH -- duplicate processing, wasted computation, potential UI glitches

---

### HIGH: Two Incompatible Type Systems

**Description:** There are two separate definitions of `ServerEvent`, `BaseEventSchema`, `isServerEvent`, and `isChatEvent`:

1. **`src/features/websocket/types.ts`** -- loose types. `ServerEvent` is a plain interface with all-optional fields (`id?`, `tripId?`, `timestamp?`). `BaseEventSchema` accepts optional fields. `isServerEvent` just checks `typeof event.type === 'string'`. `isChatEvent` matches 14 event types (including both prefixed `CHAT_*` and unprefixed `MESSAGE_SENT`, `TYPING_STATUS`, etc.).

2. **`src/types/events.ts`** -- strict types. `ServerEvent` is inferred from Zod with required fields (`id`, `tripId`, `version`, `metadata`). `BaseEventSchema` requires `version: z.number()` and `metadata.source: z.string()`. `isServerEvent` does a full Zod parse. `isChatEvent` matches only 7 `CHAT_*` prefixed types.

**Impact:**

- `WebSocketConnection` imports `isServerEvent` from `websocket/types.ts` (loose, line 1) -- nearly everything passes.
- `TripDetailScreen` imports `BaseEventSchema` and `isServerEvent` from `types/events.ts` (strict, line 28) -- events that lack `version` or `metadata` are rejected.
- Events validated by the connection layer may fail validation in the screen layer. The TripDetailScreen logs "Received completely unknown event" for events that are actually valid but don't match the strict schema.

**Evidence:**

- `WebSocketConnection.ts:1` -- imports from `./types` (loose)
- `WebSocketConnection.ts:114` -- `isServerEvent(data)` uses loose guard
- `TripDetailScreen.tsx:28` -- imports from `@/src/types/events` (strict)
- `TripDetailScreen.tsx:180-181` -- `BaseEventSchema.safeParse(rawEvent)` uses strict schema
- `websocket/types.ts:91-98` -- loose `isServerEvent`: just checks `typeof event.type === 'string'`
- `types/events.ts:255-257` -- strict `isServerEvent`: full `BaseEventSchema.safeParse(event).success`
- `websocket/types.ts:16-31` -- `ChatEventTypes` has 14 entries
- `types/events.ts:294-303` -- `isChatEvent` has 7 entries

**Severity:** HIGH -- events silently dropped due to schema mismatch

---

### MEDIUM: No Centralized Event Dispatcher

**Description:** Event routing logic is scattered across three locations with no pub/sub pattern. Each consumer registers its own callback, and the WebSocketManager manually calls store methods inline.

**Impact:** Adding a new event type requires changes in multiple files. There is no way for multiple independent consumers to subscribe to the same event type without the callback overwrite problem. Testing event routing requires mocking the entire WebSocketManager.

**Evidence:**

- `WebSocketManager.ts:97-158` -- inline routing in `wrappedCallbacks.onMessage`
- `TripDetailScreen.tsx:179-238` -- independent routing in screen's `onMessage`
- `chat/store.ts:155-163` -- independent routing in chat store's `onMessage`

**Severity:** MEDIUM -- architectural debt, high coupling, hard to extend

---

### MEDIUM: WebSocketManager Hardcodes Store Dependencies

**Description:** The `WebSocketManager` directly imports and calls `useLocationStore`, `useNotificationStore`, `useTripStore`, and dynamically requires `useChatStore` (via `require('../chat/store')` at line 233). This makes the manager tightly coupled to every feature store.

**Impact:** Circular dependency risk (chat store imports WebSocketManager, WebSocketManager requires chat store). Unit testing the manager requires mocking all stores. Adding/removing features requires editing the manager.

**Evidence:**

- `WebSocketManager.ts:14` -- imports `useLocationStore`
- `WebSocketManager.ts:15` -- imports `useNotificationStore`
- `WebSocketManager.ts:17` -- imports `useTripStore`
- `WebSocketManager.ts:233` -- `require('../chat/store')` dynamic import to avoid circular dep

**Severity:** MEDIUM -- tight coupling, circular dependency workaround already present

---

### LOW: Event Type Remapping Complexity in WebSocketManager

**Description:** `WebSocketManager.handleChatEvent()` (lines 231-503) contains a 270-line switch statement that remaps `CHAT_*` prefixed event types to unprefixed types (`CHAT_MESSAGE_SENT` -> `MESSAGE_SENT`, `CHAT_TYPING_STATUS` -> `TYPING_STATUS`, etc.) before forwarding to the chat store. This suggests the backend and frontend use different naming conventions, and the translation is done at the wrong layer.

**Impact:** Maintenance burden. The mapping is fragile and error-prone (note `CHAT_MESSAGE_SEND` vs `CHAT_MESSAGE_SENT` -- two similar but different event types handled at lines 242 and 295).

**Evidence:**

- `WebSocketManager.ts:231-503` -- entire `handleChatEvent` method
- `WebSocketManager.ts:242` -- `CHAT_MESSAGE_SEND` special case
- `WebSocketManager.ts:295` -- `CHAT_MESSAGE_SENT` separate case

**Severity:** LOW -- works correctly but adds maintenance burden

---

## 3. Proposed Solution: Centralized Event Dispatcher

### Phase 1: Add EventDispatcher (Small, Safe)

**Goal:** Eliminate the callback overwrite problem. Allow multiple consumers to subscribe to events independently.

**Design:**

```typescript
// src/features/websocket/EventDispatcher.ts

import { ServerEvent } from './types';
import { logger } from '../../utils/logger';

type EventHandler = (event: ServerEvent) => void;

class EventDispatcher {
  private static instance: EventDispatcher;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private wildcardHandlers: Set<EventHandler> = new Set();

  private constructor() {}

  static getInstance(): EventDispatcher {
    if (!EventDispatcher.instance) {
      EventDispatcher.instance = new EventDispatcher();
    }
    return EventDispatcher.instance;
  }

  /**
   * Subscribe to specific event types. Returns an unsubscribe function.
   * Pass ['*'] to subscribe to all events.
   */
  subscribe(eventTypes: string[], handler: EventHandler): () => void {
    if (eventTypes.includes('*')) {
      this.wildcardHandlers.add(handler);
      return () => this.wildcardHandlers.delete(handler);
    }

    for (const type of eventTypes) {
      if (!this.handlers.has(type)) {
        this.handlers.set(type, new Set());
      }
      this.handlers.get(type)!.add(handler);
    }

    return () => {
      for (const type of eventTypes) {
        this.handlers.get(type)?.delete(handler);
      }
    };
  }

  /**
   * Dispatch an event to all matching subscribers.
   */
  dispatch(event: ServerEvent): void {
    const typeHandlers = this.handlers.get(event.type);
    let handlerCount = 0;

    if (typeHandlers) {
      for (const handler of typeHandlers) {
        try {
          handler(event);
          handlerCount++;
        } catch (error) {
          logger.error('EventDispatcher', `Handler error for ${event.type}:`, error);
        }
      }
    }

    for (const handler of this.wildcardHandlers) {
      try {
        handler(event);
        handlerCount++;
      } catch (error) {
        logger.error('EventDispatcher', `Wildcard handler error for ${event.type}:`, error);
      }
    }

    if (handlerCount === 0) {
      logger.warn('EventDispatcher', `No handlers registered for event type: ${event.type}`);
    }
  }

  /**
   * Remove all handlers (useful for testing and cleanup).
   */
  reset(): void {
    this.handlers.clear();
    this.wildcardHandlers.clear();
  }
}

export const eventDispatcher = EventDispatcher.getInstance();
```

**Migration approach:**

1. Create `EventDispatcher.ts` as a new file -- no existing code changes yet.
2. In `WebSocketManager.wrappedCallbacks.onMessage`, after existing routing logic, add `eventDispatcher.dispatch(eventData)`.
3. Each store that needs events subscribes in its initialization:
   ```typescript
   // In chat store init or connectToChat:
   const unsub = eventDispatcher.subscribe(
     ['CHAT_MESSAGE_SENT', 'CHAT_MESSAGE_SEND', 'CHAT_TYPING_STATUS', ...],
     (event) => get().handleChatEvent(event)
   );
   ```
4. `connectToChat()` no longer needs to call `wsManager.connect()` with its own callback -- it just subscribes to the dispatcher.
5. TripDetailScreen subscribes via the dispatcher instead of passing `onMessage` to `connect()`.

**What it fixes:**

- Callback overwrite problem (CRITICAL issue)
- Duplicate processing (each store subscribes once)
- Decouples consumers from WebSocketManager

**Effort:** ~2-3 days
**Risk:** Low -- additive change, can run alongside existing callbacks during migration

---

### Phase 2: Consolidate Type Systems (Medium)

**Goal:** Single source of truth for event types, schemas, and type guards.

**Plan:**

1. Choose `src/types/events.ts` as the canonical location (it has richer schemas).
2. Relax the strict `BaseEventSchema` to handle events from the backend that may lack `version` or `metadata` (make those optional or provide defaults).
3. Move `ChatEventTypes` (the full 14-type list from `websocket/types.ts`) into `types/events.ts`.
4. Delete the duplicate type definitions from `websocket/types.ts`, re-exporting from `types/events.ts` if needed for backward compatibility.
5. Update all imports across the codebase.

**What it fixes:**

- Events silently rejected by strict schema (HIGH issue)
- Two different `isChatEvent` guards giving different results
- Two different `isServerEvent` guards (loose vs strict)
- Two different `BaseEventSchema` definitions

**Effort:** ~3-5 days (many files to update, needs thorough testing)
**Risk:** Medium -- changing validation schemas could let through malformed events if done carelessly. Needs comprehensive test coverage for each event type.

---

### Phase 3: Remove Screen-Level Event Routing (Larger)

**Goal:** Screens no longer pass `onMessage` callbacks. All routing goes through the EventDispatcher. `WebSocketManager.connect()` only establishes the connection.

**Plan:**

1. Remove the `callbacks` parameter from `WebSocketManager.connect()` (or make it optional with no `onMessage`).
2. Move `WebSocketManager`'s inline store calls (`handleLocationEvent`, `handleChatEvent`, `handlePollEvent`) into dedicated subscriber registrations using the EventDispatcher.
3. Remove `TripDetailScreen`'s `onMessage` callback entirely. The screen just calls `wsManager.connect(tripId)`.
4. Remove the `onMessage` callback from `connectToChat()`. The chat store subscribes to the dispatcher during initialization.
5. Delete `WebSocketConnection.updateCallbacks()` -- no longer needed.
6. Remove the `require('../chat/store')` dynamic import from WebSocketManager.

**What it fixes:**

- Tight coupling between WebSocketManager and stores (MEDIUM issue)
- Circular dependency workaround (MEDIUM issue)
- Complex callback wrapping in WebSocketManager

**Effort:** ~5-8 days
**Risk:** Medium-High -- fundamental change to connection lifecycle. Requires careful handling of subscribe/unsubscribe timing relative to screen mount/unmount. Needs E2E testing.

---

## 4. Quick Wins (Can Do Now)

These fixes can be applied immediately without the full refactoring plan.

### 4.1 Fix the Callback Overwrite (Highest Priority)

Change `WebSocketConnection.updateCallbacks()` to merge `onMessage` handlers rather than replacing:

```typescript
// WebSocketConnection.ts:249-251
// BEFORE:
public updateCallbacks(callbacks: Partial<ConnectionCallbacks>): void {
  this.callbacks = { ...this.callbacks, ...callbacks };
}

// AFTER:
public updateCallbacks(callbacks: Partial<ConnectionCallbacks>): void {
  const existingOnMessage = this.callbacks.onMessage;
  const newOnMessage = callbacks.onMessage;

  this.callbacks = {
    ...this.callbacks,
    ...callbacks,
    onMessage: (existingOnMessage && newOnMessage)
      ? (event) => { existingOnMessage(event); newOnMessage(event); }
      : newOnMessage || existingOnMessage,
  };
}
```

**Fixes:** CRITICAL callback overwrite issue.
**Risk:** Low. Both callbacks will fire, which may increase duplicate processing (addressed by quick win 4.2).

### 4.2 Remove Duplicate Chat Handling in TripDetailScreen

Since `WebSocketManager.handleChatEvent()` already forwards chat events to the chat store, TripDetailScreen should not also call `handleChatEvent`. Remove the `isChatEvent` block at `TripDetailScreen.tsx:188-189`:

```typescript
// TripDetailScreen.tsx:188-189
// REMOVE these lines:
if (isChatEvent(eventData)) {
  useChatStore.getState().handleChatEvent(eventData);
}
```

**Fixes:** Reduces duplicate chat event processing from 3x to 2x (full fix requires Phase 1).
**Risk:** Very low.

### 4.3 Guard Against Missing Fields in TripDetailScreen's onMessage

The TripDetailScreen uses the strict `BaseEventSchema` from `types/events.ts` which requires `version` and `metadata`. Most events from the backend likely lack these fields. Add a fallback:

```typescript
// TripDetailScreen.tsx:180-181
// BEFORE:
const serverEventParseResult = BaseEventSchema.safeParse(rawEvent);

// AFTER: Use a lenient check first
if (typeof rawEvent === 'object' && rawEvent !== null && 'type' in rawEvent) {
  const eventData = rawEvent as ServerEvent;
  useTripStore.getState().handleTripEvent(eventData);
  // ... rest of handling
}
```

**Fixes:** Events rejected by overly strict schema validation.
**Risk:** Low, but reduces type safety slightly. Mitigated by Phase 2 consolidation.

### 4.4 Remove connectToChat's Redundant connect() Call

Since `TripDetailScreen` already establishes the WebSocket connection, `connectToChat()` should not call `wsManager.connect()` again. Instead, it should only set up the chat store state and subscribe to events:

```typescript
// chat/store.ts:172
// BEFORE:
await wsManager.connect(tripId, callbacks);

// AFTER:
// Don't re-connect, just verify connection exists
if (!wsManager.isConnected()) {
  await wsManager.connect(tripId);
}
// Chat events are already routed by WebSocketManager.handleChatEvent()
```

**Fixes:** Eliminates the callback overwrite entirely for the chat store path.
**Risk:** Low. Chat events are already handled by `WebSocketManager.handleChatEvent()` at lines 141-143 and 231-503.

### 4.5 Add Deduplication by Event ID

Add a simple deduplication check using event IDs to prevent the same event from being processed multiple times:

```typescript
// Can be added in WebSocketManager's wrappedCallbacks.onMessage or in each store
const recentEventIds = new Set<string>();
const MAX_RECENT_EVENTS = 100;

function isDuplicate(eventId: string | undefined): boolean {
  if (!eventId) return false;
  if (recentEventIds.has(eventId)) return true;
  recentEventIds.add(eventId);
  if (recentEventIds.size > MAX_RECENT_EVENTS) {
    const first = recentEventIds.values().next().value;
    recentEventIds.delete(first);
  }
  return false;
}
```

**Fixes:** Mitigates duplicate processing regardless of how many handlers fire.
**Risk:** Very low. Events without IDs are not deduplicated (graceful degradation).

---

## Summary

| Issue                                 | Severity | Quick Win  | Full Fix |
| ------------------------------------- | -------- | ---------- | -------- |
| Callback overwrite (lost events)      | CRITICAL | 4.1 or 4.4 | Phase 1  |
| Duplicate event processing (up to 3x) | HIGH     | 4.2 + 4.5  | Phase 1  |
| Two incompatible type systems         | HIGH     | 4.3        | Phase 2  |
| No centralized dispatcher             | MEDIUM   | --         | Phase 1  |
| Tight store coupling in manager       | MEDIUM   | --         | Phase 3  |
| Event type remapping complexity       | LOW      | --         | Phase 2  |

**Recommended order of action:**

1. Apply quick wins 4.1 (or 4.4) and 4.2 immediately -- fixes the CRITICAL data loss issue
2. Apply quick win 4.3 -- fixes strict schema rejection
3. Implement Phase 1 (EventDispatcher) -- properly solves the architectural problem
4. Implement Phase 2 (type consolidation) -- eliminates schema confusion
5. Implement Phase 3 (remove screen callbacks) -- final cleanup
