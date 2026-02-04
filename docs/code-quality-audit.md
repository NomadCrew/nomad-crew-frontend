# NomadCrew Frontend – Code Quality & Architecture Audit

_Last updated: {{DATE}}_

---

## 1. Executive Summary
The NomadCrew React-Native (Expo) codebase already demonstrates thoughtful organisation (feature folders, typed API layer, design-token-driven theme, Zustand stores).  However, several areas need attention to reach production-grade maintainability and scalability.  This audit highlights key observations through the lens of Clean Code, SOLID principles and common design patterns, then proposes actionable next steps.

---

## 2. Strengths Observed ✅
1. **Feature-centric folder structure** (`src/features/*`) helps domain isolation.
2. **TypeScript strictness** is enabled; most modules declare explicit types and generics.
3. **Theming system** (`src/theme/*`) uses semantic tokens and utility helpers — good separation of presentation concerns.
4. **API client** wraps Axios with logging, retry & token-refresh interceptors — demonstrates Singleton pattern and separation from components.
5. **State management** leverages **Zustand** stores with memoised selectors instead of scattered `useState` calls.
6. **Logging & error constants** centralised in `src/utils/logger` and `src/api/constants.ts`.
7. **Unit-test scaffolding** (`__tests__`) and Jest setup already present.

---

## 3. Findings vs Clean Code & SOLID 🕵️‍♂️
| Principle | Current State | Impact | Recommendation |
|-----------|--------------|--------|----------------|
| **S – Single Responsibility** | Massive stores (`AuthStore` ~700 LOC) mash together token lifecycle, push notifications, onboarding, Google/Apple auth, Supabase listeners. | Difficult to reason about, hard to test, higher bug surface. | Split into specialised slices (e.g. `sessionStore`, `credentialsStore`, `pushTokenStore`). Extract API-side effects to `services/auth-service.ts`.
| **O – Open/Closed** | Logic often lives inside anonymous callback passed to `create()`; extending requires touching same file. | Violates extension safety. | Expose store actions as **services** so behaviour can be extended via composition not modification.
| **L – Liskov Substitution** | Not directly violated, but tight coupling between `api` layer & stores prevents mocking alternate implementations. | Blocks future swap (e.g. GraphQL). | Depend on abstractions (`IAuthApi`, `ITripsApi`).
| **I – Interface Segregation** | Monolithic types export huge public surfaces (e.g. `AuthState`). | Consuming components only need small subsets but import everything. | Export **selectors/hooks** per concern (`useAuthStatus`, `useCurrentUser`).
| **D – Dependency Inversion** | Stores import concrete modules (Axios instance, Supabase client). | Hard to test offline; no inversion container. | Accept dependencies via function params or context (e.g. initialise store with provided `apiClient`).

Additional Clean Code issues:
• **Duplicated Supabase client** (`src/api/supabase.ts` _and_ `src/features/auth/service.ts`).  
• **Console logging** left in production folders (search found ~20 `console.log`).  
• **Long functions & deeply nested `try/catch` blocks** reduce readability.  
• **Placeholder `App.tsx`** suggests unfinished root composition.

---

## 4. Design Pattern Usage 🔍
| Pattern | Seen In | Notes |
|---------|---------|-------|
| Singleton | `ApiClient`, theme helpers | 👍 Correctly implemented.
| Factory | `createTheme`, `createStyles` | Good abstraction.
| Adapter | `normalizeTrip` converts backend → UI model | Useful.
| Observer | Supabase `onAuthStateChange` listener inside store | Works but could be moved to event-bus layer.
| Strategy | _Not yet used_: e.g. pluggable caching strategy for lists. |

**Opportunities:** introduce Repository pattern to abstract persistence, and Command pattern for complex multi-step operations (e.g. `createTrip` + invitations + initial chat thread).

---

## 5. Code Smells & Risks ⚠️
1. **Store Size & God Objects** – `AuthStore` & `ChatStore` exceed 400-700 LOC.
2. **Duplicated knowledge** – Role strings (`'owner'|'admin'|'member'`) scattered across components & stores.
3. **Error handling** – Repetitive `catch` blocks; consider centralised `handleApiError` helper.
4. **Environment leakage** – Hard-coded fallback URLs/keys inside repo.
5. **Untyped `any` in catches** – Loses type safety, hides real error shapes.
6. **Missing loading states** – Some screens rely on store `loading` but lack suspense boundaries.

---

## 6. Testing Coverage 🧪
- Existing tests limited to snapshots; no behavioural tests for stores or API.  
- Token-refresh logic and Supabase listeners are critical paths yet untested.

---

## 7. Security 🔒
- Supabase anon key placeholder in repo – risk of accidental commit of real key.  
- Need to audit SecureStore usage for token storage (ensure keychain accessibility flags).

---

## 8. Performance 🚀
- Large selectors in stores may re-render frequently; memoisation via `zustand/shallow` recommended.  
- Missing list virtualization in some feature lists (Trips list uses FlatList; consider FlashList everywhere).

---

## 9. Actionable Roadmap 🗺️
Priority | Task | Effort | Owner Suggestion
-------- | ----- | ------ | ----------------
P0 | Remove duplicate Supabase client; consolidate in `src/services/supabase.ts`. | S | 🔄 Core Team
P0 | Split `AuthStore` into smaller stores + extract `authService`. | M | 🔄 Core Team
P1 | Introduce **Repository layer** (auth, trips, todos, chat) + interface contracts. | M | 🆕 Platform
P1 | Replace manual fetching in stores with **React Query** for server-state. | L | 🆕 Platform
P1 | Establish **domain constants** for roles, statuses (avoid string literals). | S | 🆕 Platform
P2 | Create eslint rule to block `console.log` in src. | S | DevEx
P2 | Add Jest tests for token refresh & trip CRUD flows (use MSW). | M | QE
P2 | Add storybook for isolated UI testing. | M | DX Guild
P3 | Implement CI-powered bundle & eslint checks. | S | DevOps
P3 | Document contribution guidelines & code style in `CONTRIBUTING.md`. | S | DevEx

Effort legend: S = ≤½ day, M = 1-2 days, L = >2 days.

---

## 10. Conclusion 📝
With targeted refactors around store segregation, dependency inversion and richer automated tests, the NomadCrew frontend will achieve higher maintainability and future-proof scalability while retaining its current functional strengths.

---

> _Report authored by Principal Frontend Engineer_ 