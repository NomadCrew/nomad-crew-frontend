# Active Context

## ✅ Recent Changes

- Received comprehensive refactoring and improvement guide for the NomadCrew frontend.
- Initiated update of the memory bank to reflect the refactoring plan.
- Created `src/features` and `src/navigation` directories.
- Moved existing `src/auth` contents (`secure-unlimited-store.ts`) to `src/features/auth/`.
- Created `src/features/auth/service.ts` and integrated `supabaseClient.ts` and `secure-token-manager.ts` logic into it. Deleted original files.
- Attempted to move `src/store/useAuthStore.ts` to `src/features/auth/store.ts`. **CRITICAL ISSUE: New file is incomplete due to tool limitations in reading the full original file. Auth store is currently broken.** Original file deleted.

## 🧠 Next Steps

1.  **Project Structure Refactor (Ongoing):**
    *   **Current:** Transitioning to a feature-first directory structure (`src/features/...`).
        *   **Resolve CRITICAL ISSUE:** Obtain full content of original `useAuthStore.ts` and correctly populate `src/features/auth/store.ts`.
        *   Once `store.ts` is complete: Abstract Supabase calls from `src/features/auth/store.ts` to `src/features/auth/service.ts`.
        *   Create `src/features/auth/types.ts` and move auth-specific types.
        *   Create `src/features/auth/index.ts` (barrel file).
        *   Update all codebase imports for `useAuthStore` and other moved auth utilities/types.
        *   Identify and move other core features (e.g., `chat`, `trips`, `todos`, `notifications`) into their respective `src/features/[featureName]/` directories, following a similar process (move files, then refactor structure within the feature module).
    *   Organize `app/` (Expo Router) to mirror feature groupings.
    *   Clean up obsolete files (e.g., `app/(tabs)-bkp/`, `TestScreen`).
2.  **SOLID Principles Implementation:**
    *   Refactor components and hooks to adhere to SRP (e.g., extract data-fetching from `ChatScreen` into `useChatSession` hook).
    *   Ensure Open/Closed principle is followed for extensions.
    *   Apply Liskov Substitution and Interface Segregation.
    *   Implement Dependency Inversion (e.g., decouple `useTripStore` from `useAuthStore`, abstract `WebSocketManager`).
3.  **State Management (Zustand) Enhancements:**
    *   Implement selective state selection using selectors in all components.
    *   Refactor stores to use a dedicated service layer for API calls (e.g., `tripService`, `todoService`).
    *   Standardize persistence using Zustand's `persist` middleware (e.g., for chat store).
    *   Introduce derived state/selector functions in stores.
    *   Consider Zustand middleware (Redux DevTools, immer) for debugging.
4.  **Design Patterns Adoption:**
    *   Implement Container/Presenter pattern consistently.
    *   Expand service abstraction layer (`TripService`, `TodoService`, `AuthService`).
    *   Organize and create new custom hooks (form hooks, feature-specific hooks).
    *   Use barrel files (`index.ts`) for cleaner module exports.
5.  **Coding Standards & Tooling Enforcement:**
    *   Customize and enforce ESLint rules strictly.
    *   Integrate and configure Prettier for code formatting.
    *   Adhere to TypeScript best practices (avoid `any`, use utility types, discriminated unions).
    *   Maintain JSDoc/TSDoc comments.
    *   Set up Git hooks (Husky) for pre-commit/pre-push checks.
6.  **Navigation System Refinement (Expo Router):**
    *   Consolidate routing with a proper root layout (`app/_layout.tsx`) including global providers.
    *   Implement tab and stack navigation structure.
    *   Ensure deep linking configuration is robust and test thoroughly.
    *   Implement guarded routes for authentication.
    *   Remove redundant navigation code.
7.  **Performance Optimization:**
    *   Refactor lists to use FlashList (e.g., `ChatList`).
    *   Implement pagination, windowing, and item memoization for lists.
    *   Use `React.memo` and `useMemo` judiciously.
    *   Explore lazy loading for heavy modules/screens.
    *   Optimize assets and images.
    *   Address memory management (unsubscribe listeners, efficient data storage).
    *   Enhance offline support and caching strategies.
8.  **Feature Module Refactoring (Examples: Chat, Trips):**
    *   Restructure Chat module into `src/features/chat/`.
    *   Refactor `useChatStore` (separation, selectors, service delegation).
    *   Improve Chat components (e.g., `ChatScreen`, `ChatList`).
    *   Restructure Trip module into `src/features/trips/`.
    *   Refactor `CreateTripModal` (form hook, separation of concerns).
    *   Improve `useTripStore` (decouple from auth, use `tripService`).
9.  **Testing Strategy Implementation:**
    *   Write unit tests for pure functions and utilities.
    *   Develop store tests for Zustand logic (mocking services).
    *   Implement component tests (RNTL) for rendering and interaction.
    *   Create integration tests for critical flows (MSW for API mocking).
    *   Set up E2E tests (Detox) for major user workflows.
    *   Ensure tests for persistence logic.
    *   Aim for defined code coverage goals.
10. **TypeScript & Typing Enhancements:**
    *   Achieve full type coverage, eliminate `any`.
    *   Use utility types and discriminated unions effectively.
    *   Migrate any remaining JS code to TS.
    *   Enforce strict linting for types.

## ❗ Active Decisions / Context

- The project is undergoing a major refactor based on the consultant's "NomadCrew Frontend Refactor & Improvement Guide".
- The primary goal is to elevate the codebase to a production-grade standard, focusing on modularity, maintainability, performance, and testability.
- All new code and refactored code must adhere to the principles and patterns outlined in the guide.
- The "memory bank" files are being updated to reflect this new direction and serve as the source of truth for development patterns and project status.
- **CRITICAL ISSUE:** `src/features/auth/store.ts` is incomplete due to file reading limitations. Auth functionality is broken until resolved. 