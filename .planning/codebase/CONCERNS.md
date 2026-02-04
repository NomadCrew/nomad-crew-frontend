# Codebase Concerns

**Analysis Date:** 2026-01-10

## Tech Debt

**Incomplete trip member management endpoints:**
- Issue: `revokeInvitation`, `updateMemberRole`, `removeMember` methods have TODO comments indicating endpoints not implemented
- Files: `src/features/trips/store.ts` (lines 199, 217, 230)
- Why: Backend endpoints may not exist yet or weren't connected
- Impact: Members cannot be removed or have roles changed from the app
- Fix approach: Implement backend endpoints, add to `API_PATHS`, connect store methods

**Duplicate component locations:**
- Issue: Components split between `components/` and `src/components/`
- Files: `components/common/`, `components/ui/`, `src/components/atoms/`, `src/components/molecules/`
- Why: Gradual migration to atomic design structure
- Impact: Confusing where to add new components, potential duplication
- Fix approach: Complete migration to `src/components/` with atomic design structure

**Legacy auth code:**
- Issue: `src/auth/` directory exists alongside `src/features/auth/`
- Files: `src/auth/` (legacy), `src/features/auth/` (current)
- Why: Migration to feature-based architecture incomplete
- Impact: Unclear which auth code to use/modify
- Fix approach: Complete migration, remove `src/auth/`

**Console.log in production code:**
- Issue: `console.log('[RootLayout]...')` statements in production code
- Files: `app/_layout.tsx` (lines 22, 70)
- Why: Debug logging not cleaned up
- Impact: Logs visible in production builds
- Fix approach: Replace with `logger.debug()` or remove

## Known Bugs

**Incomplete event handling:**
- Symptoms: `handleTripEvent` in trip store has TODO comment, likely doesn't handle all events
- Trigger: Server events may not update local state correctly
- Files: `src/features/trips/store.ts` (line 304-307)
- Workaround: Manual refresh of trip data
- Root cause: Event type guards and handlers not fully implemented
- Fix: Add type guards, implement handlers for each event type

## Security Considerations

**Hardcoded fallback Supabase URL:**
- Risk: URL hardcoded in `src/api/supabase.ts` as fallback
- Files: `src/api/supabase.ts` (line 8)
- Current mitigation: Warning logged if fallback used
- Recommendations: Fail fast if env vars missing in production builds

**Google Client IDs in eas.json:**
- Risk: OAuth client IDs visible in config file
- Files: `eas.json` (multiple lines)
- Current mitigation: Client IDs are considered public, server validates origins
- Recommendations: Ensure proper OAuth origin restrictions on Google Cloud Console

## Performance Bottlenecks

**Auth store initialization complexity:**
- Problem: `initialize()` in auth store has multiple async operations, nested try/catch
- Files: `src/features/auth/store.ts` (lines 93-274)
- Measurement: Not profiled, but complex code path
- Cause: Multiple sources of truth for session (Supabase, SecureStore)
- Improvement path: Simplify to trust Supabase as source of truth, remove redundant SecureStore checks

**Large store files:**
- Problem: Auth store is 1000+ lines, complex with many methods
- Files: `src/features/auth/store.ts`
- Measurement: 1080 lines
- Cause: All auth logic in single store
- Improvement path: Extract services, split into smaller composable stores

## Fragile Areas

**Auth state machine:**
- Files: `src/features/auth/store.ts`
- Why fragile: Complex state transitions (unauthenticated -> verifying -> authenticated), multiple auth methods (email, Google, Apple), each with different flows
- Common failures: State not updated correctly, token refresh race conditions
- Safe modification: Add comprehensive tests before changes, trace state transitions
- Test coverage: `__tests__/store/useAuthStore.test.ts` exists but may not cover all flows

**Provider hierarchy:**
- Files: `app/_layout.tsx`
- Why fragile: 7+ nested providers, order matters, any crash blocks app
- Common failures: Provider initialization errors, circular dependencies
- Safe modification: Add error boundaries per provider level, test startup
- Test coverage: Limited integration testing of provider hierarchy

## Missing Features

**Input validation in location store:**
- Problem: Multiple TODOs indicate validation not implemented
- Files: `__tests__/store/useLocationStore.test.ts` (lines 239, 248, 257, 266, 275)
- Current workaround: Tests skip validation, may accept invalid coordinates
- Blocks: Proper error handling for invalid location data
- Implementation complexity: Low - add validation in store methods

**Chat validation:**
- Problem: Message validation TODO comments in tests
- Files: `__tests__/store/useChatStore.test.ts` (lines 494, 502, 510)
- Current workaround: May accept malformed messages
- Blocks: Robust error handling for chat edge cases

## Test Coverage Gaps

**E2E flow testing:**
- What's not tested: Full user flows (signup -> onboarding -> create trip -> invite -> chat)
- Risk: Integration bugs between features not caught
- Priority: Medium
- Difficulty to test: Maestro setup exists, needs more flow definitions

**Provider/layout testing:**
- What's not tested: Root layout initialization, provider hierarchy
- Files: `app/_layout.tsx`, `app/AppInitializer.tsx`
- Risk: App initialization bugs not caught until runtime
- Priority: Medium
- Difficulty to test: Need to mock many native modules, complex setup

**WebSocket event handling:**
- What's not tested: Real-time event processing
- Files: `src/features/websocket/`, event handlers in stores
- Risk: Events may not update state correctly
- Priority: Medium
- Difficulty to test: Need to mock Supabase Realtime

## Dependencies at Risk

**Legacy packages:**
- `react-native-onboarding-swiper` - Last updated a while ago, may have React Native compatibility issues
- Risk: May break with React Native upgrades
- Impact: Onboarding flow would need replacement
- Migration plan: Build custom onboarding or use maintained alternative

**Canary dependency:**
- `react-native-reanimated-carousel@4.0.0-canary.22` - Pre-release version
- Files: `package.json`
- Risk: Unstable, may have breaking changes
- Impact: Carousel components could break
- Migration plan: Update to stable release when available

## Documentation Gaps

**API paths not fully documented:**
- Problem: `API_PATHS` utility not clearly documented
- Files: `src/utils/api-paths.ts`
- Risk: Developers may not know all available endpoints
- Recommendation: Add JSDoc comments to API_PATHS

**Store action documentation:**
- Problem: Complex store actions lack JSDoc
- Files: `src/features/auth/store.ts`, `src/features/trips/store.ts`
- Risk: Misuse of store methods, incorrect parameters
- Recommendation: Add JSDoc to all public store actions

---

*Concerns audit: 2026-01-10*
*Update as issues are fixed or new ones discovered*
