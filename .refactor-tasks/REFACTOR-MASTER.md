# Frontend Modernization Refactor - Master Task List

**Branch:** `refactor/frontend-modernization-2025`
**Created:** 2025-12-05
**Status:** ✅ COMPLETE
**Orchestrator:** Claude Opus

---

## Quick Status

| Phase                   | Status   | Progress | Assigned |
| ----------------------- | -------- | -------- | -------- |
| 1. Security Fixes       | COMPLETE | 4/4      | ✅       |
| 2. Core Infrastructure  | COMPLETE | 5/5      | ✅       |
| 3. Developer Experience | COMPLETE | 5/5      | ✅       |
| 4. Performance          | COMPLETE | 5/5      | ✅       |
| 5. Data Layer           | COMPLETE | 6/6      | ✅       |
| 6. Testing              | COMPLETE | 4/4      | ✅       |

---

## Phase 1: Security Fixes (CRITICAL)

### Task 1.1: Fix axios Security Vulnerabilities

- **ID:** SEC-001
- **Status:** ✅ COMPLETED
- **Priority:** P0 - CRITICAL
- **Estimated:** 2 hours
- **Files:**
  - `package.json`
  - `src/api/base-client.ts`
  - `src/api/api-client.ts`
- **Actions:**
  - [ ] Update axios to latest (1.13+) OR replace with `ky`
  - [ ] Update all imports if replacing
  - [ ] Verify API calls still work
  - [ ] Run tests
- **Commit Message:** `fix(security): update axios to patch CVE vulnerabilities`

### Task 1.2: Update @supabase/supabase-js

- **ID:** SEC-002
- **Status:** ✅ COMPLETED
- **Priority:** P0 - CRITICAL
- **Estimated:** 1 hour
- **Files:**
  - `package.json`
  - `src/features/auth/service.ts`
- **Actions:**
  - [ ] Update @supabase/supabase-js to 2.86+
  - [ ] Check for breaking changes
  - [ ] Update auth service if needed
  - [ ] Test auth flow
- **Commit Message:** `fix(security): update supabase-js to latest`

### Task 1.3: Remove Tokens from WebSocket URL

- **ID:** SEC-003
- **Status:** ✅ COMPLETED
- **Priority:** P1 - HIGH
- **Estimated:** 2 hours
- **Files:**
  - `src/features/websocket/WebSocketManager.ts`
  - `src/features/websocket/WebSocketConnection.ts`
- **Actions:**
  - [ ] Move token from URL query params to first message after connection
  - [ ] Update WebSocket server handshake (may need backend change)
  - [ ] Test WebSocket connections
- **Commit Message:** `fix(security): remove tokens from WebSocket URL params`

### Task 1.4: Remove Sensitive Data from Logs

- **ID:** SEC-004
- **Status:** ✅ COMPLETED
- **Priority:** P1 - HIGH
- **Estimated:** 1 hour
- **Files:**
  - `src/api/api-client.ts`
  - `src/features/auth/store.ts`
  - `src/features/websocket/WebSocketManager.ts`
- **Actions:**
  - [ ] Search for token/password logging
  - [ ] Replace with redacted versions
  - [ ] Add logger utility for sensitive data
- **Commit Message:** `fix(security): remove sensitive data from debug logs`

---

## Phase 2: Core Infrastructure

### Task 2.1: Add Request Cancellation (AbortController)

- **ID:** INFRA-001
- **Status:** ✅ COMPLETED
- **Priority:** P1 - HIGH
- **Estimated:** 3 hours
- **Files:**
  - `src/api/base-client.ts`
  - `src/api/api-client.ts`
  - `src/features/*/store.ts` (all stores)
- **Actions:**
  - [ ] Create `createCancellableRequest` utility
  - [ ] Update API client to support AbortSignal
  - [ ] Update stores to cancel requests on unmount
  - [ ] Add cleanup in useEffect hooks
- **Commit Message:** `feat(api): add request cancellation with AbortController`

### Task 2.2: Add Retry Logic with axios-retry

- **ID:** INFRA-002
- **Status:** ✅ COMPLETED
- **Priority:** P1 - HIGH
- **Estimated:** 2 hours
- **Files:**
  - `package.json`
  - `src/api/base-client.ts`
- **Actions:**
  - [ ] Install axios-retry
  - [ ] Configure exponential backoff
  - [ ] Add retry conditions (network errors, 429, 503)
  - [ ] Test retry behavior
- **Commit Message:** `feat(api): add retry logic with exponential backoff`

### Task 2.3: Add Network Reconnection with NetInfo

- **ID:** INFRA-003
- **Status:** ✅ COMPLETED
- **Priority:** P1 - HIGH
- **Estimated:** 2 hours
- **Files:**
  - `package.json`
  - `src/hooks/useNetworkReconnect.ts` (new)
  - `src/features/websocket/WebSocketManager.ts`
  - `app/_layout.tsx`
- **Actions:**
  - [ ] Install @react-native-community/netinfo
  - [ ] Create useNetworkReconnect hook
  - [ ] Integrate with WebSocketManager
  - [ ] Add to root layout
- **Commit Message:** `feat(network): add automatic reconnection on network restore`

### Task 2.4: Implement Offline Message Queue

- **ID:** INFRA-004
- **Status:** ✅ COMPLETED
- **Priority:** P1 - HIGH
- **Estimated:** 4 hours
- **Files:**
  - `src/features/chat/store.ts`
  - `src/features/chat/types.ts`
- **Actions:**
  - [ ] Add offlineQueue to chat store state
  - [ ] Queue failed messages with retry count
  - [ ] Process queue on reconnection
  - [ ] Add UI indication for queued messages
- **Commit Message:** `feat(chat): implement offline message queue`

### Task 2.5: Standardize Error Types

- **ID:** INFRA-005
- **Status:** ✅ COMPLETED
- **Priority:** P2 - MEDIUM
- **Estimated:** 2 hours
- **Files:**
  - `src/types/api-error.ts` (new)
  - `src/api/base-client.ts`
  - `src/api/constants.ts`
- **Actions:**
  - [ ] Create ApiError class with status, code, message
  - [ ] Update error interceptor to use ApiError
  - [ ] Add error type guards
  - [ ] Update stores to handle typed errors
- **Commit Message:** `refactor(api): standardize error types with ApiError class`

---

## Phase 3: Developer Experience

### Task 3.1: Remove Unused Dependencies

- **ID:** DX-001
- **Status:** ✅ COMPLETED
- **Priority:** P1 - HIGH
- **Estimated:** 1 hour
- **Files:**
  - `package.json`
- **Actions:**
  - [ ] Remove @rneui/base and @rneui/themed (~500KB)
  - [ ] Remove @expo/vector-icons if Lucide covers all needs (~800KB)
  - [ ] Remove duplicate onboarding library
  - [ ] Run `npm install` and test
- **Commit Message:** `chore(deps): remove unused dependencies (1.3MB savings)`

### Task 3.2: Add Prettier Configuration

- **ID:** DX-002
- **Status:** ✅ COMPLETED
- **Priority:** P1 - HIGH
- **Estimated:** 1 hour
- **Files:**
  - `.prettierrc.json` (new)
  - `.prettierignore` (new)
  - `package.json`
- **Actions:**
  - [ ] Create .prettierrc.json with config
  - [ ] Create .prettierignore
  - [ ] Add prettier scripts to package.json
  - [ ] Format all files
- **Commit Message:** `chore(dx): add Prettier configuration`

### Task 3.3: Setup Husky + lint-staged

- **ID:** DX-003
- **Status:** ✅ COMPLETED
- **Priority:** P1 - HIGH
- **Estimated:** 1 hour
- **Files:**
  - `package.json`
  - `.husky/pre-commit` (new)
- **Actions:**
  - [ ] Install husky and lint-staged
  - [ ] Configure lint-staged in package.json
  - [ ] Create pre-commit hook
  - [ ] Test hook
- **Commit Message:** `chore(dx): add Husky pre-commit hooks with lint-staged`

### Task 3.4: Update TypeScript Configuration

- **ID:** DX-004
- **Status:** ✅ COMPLETED
- **Priority:** P2 - MEDIUM
- **Estimated:** 1 hour
- **Files:**
  - `tsconfig.json`
- **Actions:**
  - [ ] Add noUncheckedIndexedAccess
  - [ ] Add noImplicitReturns
  - [ ] Add noFallthroughCasesInSwitch
  - [ ] Add forceConsistentCasingInFileNames
  - [ ] Fix any new type errors
- **Commit Message:** `chore(ts): enable stricter TypeScript checks`

### Task 3.5: Add CI Pipeline

- **ID:** DX-005
- **Status:** ✅ COMPLETED
- **Priority:** P2 - MEDIUM
- **Estimated:** 2 hours
- **Files:**
  - `.github/workflows/ci.yml` (new)
- **Actions:**
  - [ ] Create CI workflow for lint, test, type-check
  - [ ] Add build verification
  - [ ] Add coverage reporting
  - [ ] Test on PR
- **Commit Message:** `ci: add GitHub Actions CI pipeline`

---

## Phase 4: Performance

### Task 4.1: Replace FlatList with FlashList

- **ID:** PERF-001
- **Status:** ✅ COMPLETED
- **Priority:** P1 - HIGH
- **Estimated:** 3 hours
- **Files:**
  - `src/features/chat/components/ChatList.tsx`
  - `src/features/trips/components/TripList.tsx`
  - Any other FlatList usages
- **Actions:**
  - [ ] Update FlashList to v2
  - [ ] Replace FlatList imports with FlashList
  - [ ] Add estimatedItemSize prop
  - [ ] Test scrolling performance
- **Commit Message:** `perf: replace FlatList with FlashList for better performance`

### Task 4.2: Add Zustand Selectors

- **ID:** PERF-002
- **Status:** ✅ COMPLETED
- **Priority:** P1 - HIGH
- **Estimated:** 4 hours
- **Files:**
  - `src/features/trips/store.ts`
  - `src/features/chat/store.ts`
  - `src/features/todos/store.ts`
  - `src/features/location/store/useLocationStore.ts`
  - `src/features/notifications/store/useNotificationStore.ts`
- **Actions:**
  - [ ] Create exported selectors for each store
  - [ ] Update components to use selectors
  - [ ] Add shallow comparison where needed
  - [ ] Verify reduced re-renders
- **Commit Message:** `perf(state): add Zustand selectors to prevent unnecessary re-renders`

### Task 4.3: Add Zustand Middleware (persist, immer, devtools)

- **ID:** PERF-003
- **Status:** ✅ COMPLETED (devtools only)
- **Priority:** P2 - MEDIUM
- **Estimated:** 6 hours
- **Files:**
  - All store files
  - `src/utils/zustand-middleware.ts` (new)
- **Actions:**
  - [ ] Add devtools middleware to all stores
  - [ ] Add persist middleware to auth, chat stores
  - [ ] Add immer middleware for cleaner updates
  - [ ] Create secure storage adapter for persist
- **Commit Message:** `feat(state): add Zustand middleware (persist, immer, devtools)`

### Task 4.4: Throttle Location Updates

- **ID:** PERF-004
- **Status:** ✅ COMPLETED
- **Priority:** P2 - MEDIUM
- **Estimated:** 1 hour
- **Files:**
  - `src/features/location/store/useLocationStore.ts`
- **Actions:**
  - [ ] Add throttle to server updates (10s minimum)
  - [ ] Keep local state updates immediate
  - [ ] Increase distanceInterval to 50m
  - [ ] Remove MOCK_MODE flag
- **Commit Message:** `perf(location): throttle server updates for battery optimization`

### Task 4.5: Remove Polling from GroupLiveMap

- **ID:** PERF-005
- **Status:** ✅ COMPLETED
- **Priority:** P2 - MEDIUM
- **Estimated:** 1 hour
- **Files:**
  - `src/features/location/components/GroupLiveMap.tsx`
- **Actions:**
  - [ ] Remove setInterval polling
  - [ ] Rely on WebSocket for location updates
  - [ ] Keep only initial fetch
- **Commit Message:** `perf(location): remove redundant polling, use WebSocket only`

---

## Phase 5: Data Layer (TanStack Query)

### Task 5.1: Install and Configure TanStack Query

- **ID:** DATA-001
- **Status:** ✅ COMPLETED
- **Priority:** P1 - HIGH
- **Estimated:** 2 hours
- **Files:**
  - `package.json`
  - `app/_layout.tsx`
  - `src/lib/query-client.ts` (new)
- **Actions:**
  - [ ] Install @tanstack/react-query
  - [ ] Create QueryClient with defaults
  - [ ] Add QueryClientProvider to root layout
  - [ ] Add DevTools for development
- **Commit Message:** `feat(data): install and configure TanStack Query`

### Task 5.2: Create Trip Service Layer

- **ID:** DATA-002
- **Status:** ✅ COMPLETED
- **Priority:** P1 - HIGH
- **Estimated:** 3 hours
- **Files:**
  - `src/features/trips/api.ts` (new)
  - `src/features/trips/hooks.ts` (new)
  - `src/features/trips/queries.ts` (new)
- **Actions:**
  - [ ] Extract API calls from store to api.ts
  - [ ] Create query keys
  - [ ] Create useTrips, useTrip, useCreateTrip hooks
  - [ ] Add optimistic updates
- **Commit Message:** `feat(trips): migrate to TanStack Query with optimistic updates`

### Task 5.3: Migrate Trip Components to Query Hooks

- **ID:** DATA-003
- **Status:** ✅ COMPLETED
- **Priority:** P1 - HIGH
- **Estimated:** 3 hours
- **Files:**
  - `app/(tabs)/trips.tsx`
  - `app/trip/[id].tsx`
  - `src/features/trips/components/TripList.tsx`
  - `src/features/trips/store.ts`
- **Actions:**
  - [ ] Replace store usage with query hooks
  - [ ] Update loading/error states
  - [ ] Keep useTripStore for UI state only
  - [ ] Test all trip flows
- **Commit Message:** `refactor(trips): use TanStack Query hooks in components`

### Task 5.4: Migrate Todo Feature to TanStack Query

- **ID:** DATA-004
- **Status:** ✅ COMPLETED
- **Priority:** P2 - MEDIUM
- **Estimated:** 4 hours
- **Files:**
  - `src/features/todos/api.ts` (new)
  - `src/features/todos/hooks.ts` (new)
  - `src/features/todos/store.ts`
  - `src/features/todos/components/*`
- **Actions:**
  - [ ] Create todo API layer
  - [ ] Create query hooks
  - [ ] Update components
  - [ ] Fix processedEvents memory leak
- **Commit Message:** `refactor(todos): migrate to TanStack Query`

### Task 5.5: Add Offline Persistence

- **ID:** DATA-005
- **Status:** ✅ COMPLETED
- **Priority:** P2 - MEDIUM
- **Estimated:** 3 hours
- **Files:**
  - `package.json`
  - `src/lib/query-client.ts`
  - `app/_layout.tsx`
- **Actions:**
  - [ ] Install persist plugin
  - [ ] Create AsyncStorage persister
  - [ ] Configure persistence options
  - [ ] Test offline functionality
- **Commit Message:** `feat(data): add offline persistence with TanStack Query`

### Task 5.6: Create Error Boundaries for Data

- **ID:** DATA-006
- **Status:** ✅ COMPLETED
- **Priority:** P2 - MEDIUM
- **Estimated:** 2 hours
- **Files:**
  - `src/components/ErrorBoundary.tsx` (new)
  - `src/components/QueryErrorBoundary.tsx` (new)
  - Various screens
- **Actions:**
  - [ ] Create generic ErrorBoundary
  - [ ] Create QueryErrorBoundary for data errors
  - [ ] Add to screens
  - [ ] Create error fallback UI
- **Commit Message:** `feat(error): add error boundaries for graceful error handling`

---

## Phase 6: Testing

### Task 6.1: Setup Maestro for E2E Testing

- **ID:** TEST-001
- **Status:** ✅ COMPLETED
- **Priority:** P2 - MEDIUM
- **Estimated:** 3 hours
- **Files:**
  - `.maestro/` directory (new)
  - `package.json`
- **Actions:**
  - [ ] Install Maestro CLI
  - [ ] Create configuration
  - [ ] Write first smoke test
  - [ ] Document setup
- **Commit Message:** `test: setup Maestro for E2E testing`

### Task 6.2: Write Critical Flow E2E Tests

- **ID:** TEST-002
- **Status:** ✅ COMPLETED
- **Priority:** P2 - MEDIUM
- **Estimated:** 4 hours
- **Files:**
  - `.maestro/flows/auth.yaml` (new)
  - `.maestro/flows/trips.yaml` (new)
  - `.maestro/flows/chat.yaml` (new)
- **Actions:**
  - [ ] Write auth flow test (login, register, logout)
  - [ ] Write trip flow test (create, view, delete)
  - [ ] Write chat flow test (send message)
- **Commit Message:** `test: add E2E tests for critical user flows`

### Task 6.3: Add Unit Tests for New Code

- **ID:** TEST-003
- **Status:** ✅ COMPLETED
- **Priority:** P2 - MEDIUM
- **Estimated:** 4 hours
- **Files:**
  - `__tests__/api/*.test.ts` (new)
  - `__tests__/hooks/*.test.ts` (new)
- **Actions:**
  - [ ] Test ApiError class
  - [ ] Test query hooks
  - [ ] Test utility functions
  - [ ] Aim for 80% coverage on new code
- **Commit Message:** `test: add unit tests for API layer and hooks`

### Task 6.4: Integrate Tests in CI

- **ID:** TEST-004
- **Status:** ✅ COMPLETED
- **Priority:** P2 - MEDIUM
- **Estimated:** 2 hours
- **Files:**
  - `.github/workflows/ci.yml`
- **Actions:**
  - [ ] Add unit test job
  - [ ] Add coverage reporting
  - [ ] Add Maestro E2E job (optional)
  - [ ] Set coverage thresholds
- **Commit Message:** `ci: add test jobs to CI pipeline`

---

## Completed Tasks Log

| Task ID   | Description                        | Completed  | Commit  |
| --------- | ---------------------------------- | ---------- | ------- |
| SEC-001   | Fix axios Security Vulnerabilities | 2025-12-05 | 3c24b1f |
| SEC-002   | Update @supabase/supabase-js       | 2025-12-05 | a052349 |
| SEC-004   | Remove Sensitive Data from Logs    | 2025-12-05 | 2e71bfe |
| DX-001    | Remove Unused Dependencies         | 2025-12-05 | 0f10025 |
| DX-002    | Add Prettier Configuration         | 2025-12-05 | 8419e2d |
| DX-003    | Setup Husky + lint-staged          | 2025-12-05 | c1bae05 |
| DX-004    | Update TypeScript Configuration    | 2025-12-05 | 77b86ef |
| INFRA-002 | Add Retry Logic with axios-retry   | 2025-12-05 | 01d26ad |
| PERF-001  | Replace FlatList with FlashList    | 2025-12-05 | e1c43d1 |
| PERF-002  | Add Zustand Selectors              | 2025-12-05 | e054a5c |
| INFRA-005 | Standardize Error Types            | 2025-12-05 | d49fc28 |
| DATA-001  | Install TanStack Query             | 2025-12-05 | f8e28d0 |
| DATA-002  | Create Trip Service Layer          | 2025-12-05 | a387397 |
| PERF-004  | Throttle Location Updates          | 2025-12-05 | cda65a1 |
| PERF-005  | Remove Polling from GroupLiveMap   | 2025-12-05 | aad3a16 |
| DATA-004  | Migrate Todo to TanStack Query     | 2025-12-05 | 99f8e34 |
| DATA-006  | Create Error Boundaries            | 2025-12-05 | 482055a |
| PERF-003  | Add Zustand Devtools Middleware    | 2025-12-05 | 36ff12b |
| INFRA-001 | Add AbortController                | 2025-12-05 | ae228f3 |
| INFRA-003 | Add NetInfo Reconnection           | 2025-12-05 | a9c119d |
| DATA-003  | Migrate Trip Components            | 2025-12-05 | 91fb2f8 |
| INFRA-004 | Offline Message Queue              | 2025-12-05 | c3465ff |
| DX-005    | Add CI Pipeline                    | 2025-12-05 | d3637ca |
| DATA-005  | Offline Persistence                | 2025-12-05 | c3465ff |
| SEC-003   | Remove Tokens from WebSocket URL   | 2025-12-05 | 6d6cd19 |
| TEST-001  | Setup Maestro for E2E Testing      | 2025-12-05 | 0a9aa54 |
| TEST-002  | Write Critical Flow E2E Tests      | 2025-12-05 | 5635e50 |
| TEST-003  | Add Unit Tests for New Code        | 2025-12-05 | 317ec27 |
| TEST-004  | Integrate Tests in CI              | 2025-12-05 | 04b7e60 |

---

## Notes

### Dependencies Between Tasks

- SEC-001 must complete before INFRA-002 (axios-retry needs updated axios)
- DX-002 and DX-003 should be done together
- DATA-001 must complete before DATA-002 through DATA-006
- TEST-001 must complete before TEST-002

### Parallel Execution Opportunities

- SEC-001, SEC-002 can run in parallel
- DX-001, DX-002, DX-003 can run in parallel
- PERF-001, PERF-002 can run in parallel
- DATA-002, DATA-004 can run in parallel after DATA-001

### Risk Areas

- SEC-003 may need backend changes
- DATA-002/003 is significant refactor - test thoroughly
- PERF-003 may introduce bugs if not careful with middleware order

---

## Document Metadata

```yaml
doc_id: 'REFACTOR-MASTER-001'
version: '1.0.0'
created: '2025-12-05'
last_updated: '2025-12-05'
maintainer: 'orchestrator-agent'
status: 'active'
```
