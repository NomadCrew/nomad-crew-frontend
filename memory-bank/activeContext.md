# Active Context

## ✅ Recent Changes

- **WebSocket Event Handling:** Refined WebSocket `onMessage` handler in `TripDetailScreen.tsx` to correctly parse and route `ServerEvent` and `Notification` types to their respective stores, resolving linter errors.
- **Todos Module Refactor (Complete):**
    - Moved `useTodoStore.ts` to `src/features/todos/store.ts`.
    - Moved `todo.ts` (types) to `src/features/todos/types.ts`.
    - Moved `AddTodoModal.tsx`, `TodoErrorBoundary.tsx`, `TodoItem.tsx`, `TodoList.tsx` from `components/todo/` to `src/features/todos/components/`.
    - Updated all relevant import paths across the codebase.
    - Deleted old files from `src/store/`, `src/types/`, and `components/todo/`.
- **Linting/Stability Check (Post-Trips Refactor):**
    - Fixed import errors in `app/AppInitializer.tsx`.
    - Fixed conditional hook call errors in `app/index.tsx` and `app/_layout.tsx`.
    - Refactored `app/_layout.tsx` to a standard `RootLayout` structure.
    - Fixed incorrect `useCallback` usage in `components/ui/PerformanceWrapper.tsx`.
    - Corrected array type style in `src/api/api-client.ts`.
    - Lint command passes with 0 errors (226 warnings remain).
- Corrected import path for `ChatScreen` and `MobileChatScreen` in `app/chat/[tripId].tsx`.
- Corrected logger module in `app/chat/[tripId].tsx` from 'Chat Route' to 'CHAT'.
- Received comprehensive refactoring and improvement guide for the NomadCrew frontend.
- Initiated update of the memory bank to reflect the refactoring plan.
- Created `src/features` and `src/navigation` directories.
- **Auth Module Refactor (Complete):**
    - Moved existing `src/auth` contents to `src/features/auth/`.
    - Created `src/features/auth/service.ts`, integrating `supabaseClient.ts` and `secure-token-manager.ts` logic. Deleted original files.
    - Moved `src/store/useAuthStore.ts` to `src/features/auth/store.ts` (full content restored). Original file deleted.
    - Abstracted direct Supabase calls from `store.ts` to methods in `service.ts`.
    - Moved auth types from `src/types/auth.ts` to `src/features/auth/types.ts`. `ApiError` interface also moved. Original global `auth.ts` type file deleted.
    - Created barrel file `src/features/auth/index.ts`.
    - Updated all identified codebase imports for `useAuthStore` and `supabaseClient` to new paths.
    - Refactored `registerPushToken` in `store.ts` to use `AuthService`.
    - Reviewed `registerAuthHandlers` mechanism; current approach deemed acceptable.
    - Finalized `src/features/auth/types.ts` by removing redundant custom `Session` interface.
    - Verified `src/store/` and `src/types/` directories are not empty and should not be deleted.
- **Chat Module Refactor (Complete):**
    - Moved `screens/chat/ChatScreen.tsx` to `src/features/chat/screens/ChatScreen.tsx`.
    - Moved `screens/chat/MobileChatScreen.tsx` to `src/features/chat/screens/MobileChatScreen.tsx`.
    - Moved chat components from `components/chat/` to `src/features/chat/components/`.
    - Deleted old `components/chat/index.ts` and `components/chat/` directory.
    - Moved `src/store/useChatStore.ts` to `src/features/chat/store.ts`.
    - Moved `src/services/chatService.ts` to `src/features/chat/service.ts`.
    - Moved chat-related types from `src/types/chat.ts` to `src/features/chat/types.ts`. Original global `chat.ts` type file deleted.
    - Updated all imports for moved chat files throughout the codebase.
    - Deleted old `screens/chat/` directory.
- **Barrel File Refactor (Auth & Chat Complete):** Updated all imports previously using `src/features/auth/index.ts` and `src/features/chat/index.ts` to use direct module paths. Deleted both barrel files.
- **Trips Module Refactor (Complete):**
    - Created `src/features/trips/` and subdirectories `screens/`, `components/`.
    - Moved `src/types/trip.ts` to `src/features/trips/types.ts`.
    - Moved `src/store/useTripStore.ts` to `src/features/trips/store.ts`.
    - Moved `screens/trips/TripDetailScreen.tsx` (larger one) to `src/features/trips/screens/TripDetailScreen.tsx`.
    - Deleted `screens/TripDetailScreen.tsx` (smaller, unused one).
    - Moved all components from `components/trips/` to `src/features/trips/components/`.
    - Deleted `components/trips/` directory.
    - Renamed `src/features/trips/components/TripHeader.tsx` to `TripDetailHeader.tsx`.
    - Updated imports in `app/trip/[id].tsx` to point to new store and screen locations.
    - Updated all identified outdated imports for trip types, store, screens, and components throughout the codebase.
    - Corrected an import path for `ChatCard` in `src/features/trips/screens/TripDetailScreen.tsx`.

## 🧠 Next Steps

1.  **~~Chat Module Refactor: Plan and execute refactoring for the chat module into `src/features/chat/`.~~ (DONE - Covered previously)**
2.  **Project Structure Refactor (Ongoing):**
    *   **~~Next Feature: Identify and move the `todos` module to `src/features/todos/`.~~ (DONE)**
    *   **Next Feature:** Identify and move the `location` store (`src/store/useLocationStore.ts`) and related components/screens (e.g., `app/location/`, `components/location/`) to `src/features/location/`. Refactor its internal structure (store, types, components, services if applicable).
    *   Follow with the `notifications` module (`src/store/useNotificationStore.ts`, `src/components/notifications/`, etc.).
    *   Consolidate global directories (`components`, `hooks`, `services`, `store`, `types`, `utils`) under `src/`, ensuring they only contain truly shared, non-feature-specific code.
    *   Organize `app/` (Expo Router) to mirror feature groupings.
    *   Clean up obsolete files (e.g., `app/(tabs)-bkp/`, `TestScreen`).
3.  **Verify Application Build & Run (Post-Refactor):** After all major refactoring (including Location and Notifications), perform a full build and run the application on a device/emulator to ensure stability and catch any runtime errors introduced by the refactoring.
4.  **Address Lint Warnings:** Systematically go through the remaining lint warnings and fix them.
5.  **SOLID Principles Implementation (Post-Structure Refactor):**
    *   Begin applying SOLID principles systematically to the newly structured feature modules.
6.  **State Management Refinement (Zustand):**
    *   Review all Zustand stores after they are moved into their respective feature folders.
7.  **Navigation System Refinement (Expo Router).**
8.  **Component Refactoring & UI System.**
9.  **API Service Layer & Data Fetching.**
10. **Performance Optimization.**
11. **Testing Strategy.**
12. **Coding Standards & Tooling Setup.**


## ❗ Active Decisions / Context

-   The refactor is following the feature-first structure outlined in the provided guide.
-   Modules are moved, then internal structures refactored, then imports updated.
-   **Rule: No Barrel Files for Application Imports.** Internal application imports must be direct.
-   `useTodoStore` and `useLocationStore` are still in `src/store/` as their respective features haven't been refactored yet. Their imports in other features point to the old paths for now.