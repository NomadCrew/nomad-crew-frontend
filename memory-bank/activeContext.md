# Active Context

## ✅ Recent Changes

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
- **Chat Module Refactor (In Progress):**
    - Moved `screens/chat/ChatScreen.tsx` to `src/features/chat/screens/ChatScreen.tsx`.
    - Moved `screens/chat/MobileChatScreen.tsx` to `src/features/chat/screens/MobileChatScreen.tsx`.
    - Moved `components/chat/ChatButton.tsx` to `src/features/chat/components/ChatButton.tsx`.
    - Moved `components/chat/ChatCard.tsx` to `src/features/chat/components/ChatCard.tsx`.
    - Moved `components/chat/ChatMessage.tsx` to `src/features/chat/components/ChatMessage.tsx`.
    - Moved `components/chat/ChatList.tsx` to `src/features/chat/components/ChatList.tsx`.
    - Moved `components/chat/ChatInput.tsx` to `src/features/chat/components/ChatInput.tsx`.
    - Moved `components/chat/ChatGroupItem.tsx` to `src/features/chat/components/ChatGroupItem.tsx`.
    - Moved `components/chat/ChatGroupList.tsx` to `src/features/chat/components/ChatGroupList.tsx`.
    - Moved `components/chat/ChatAuthError.tsx` to `src/features/chat/components/ChatAuthError.tsx`.
    - Deleted old `components/chat/index.ts` and `components/chat/` directory (and orphaned files within).
    - Moved `src/store/useChatStore.ts` to `src/features/chat/store.ts`.
    - Moved `src/services/chatService.ts` to `src/features/chat/service.ts`.
    - Moved chat-related types from `src/types/chat.ts` to `src/features/chat/types.ts`. Original global `chat.ts` type file deleted.
    - Created `src/features/chat/index.ts` barrel file.
    - Updated all imports for moved chat files throughout the codebase.
    - Deleted old `screens/chat/` directory and orphaned screen files.

## 🧠 Next Steps

1.  **Project Structure Refactor (Ongoing):**
    *   **Immediate Task: Refactor Barrel Files:** Update all imports currently using barrel files (`src/features/auth/index.ts`, `src/features/chat/index.ts`) to use direct imports from specific modules. Subsequently, delete these barrel files.
    *   **Next Feature:** Identify and move the `trips` module to `src/features/trips/`. Refactor its internal structure.
    *   Follow with `todos`, and `notifications` modules.
    *   Consolidate global directories (`components`, `hooks`, `services`, `store`, `types`, `utils`) under `src/`, ensuring they only contain truly shared, non-feature-specific code.
    *   Organize `app/` (Expo Router) to mirror feature groupings.
    *   Clean up obsolete files (e.g., `app/(tabs)-bkp/`, `TestScreen`).
2.  **SOLID Principles Implementation (Post-Structure Refactor):**
    *   Begin applying SOLID principles systematically to the newly structured feature modules.
    *   Refactor components and hooks to adhere to SRP.
    *   Ensure Open/Closed principle is followed for extensions.
    *   Apply Liskov Substitution and Interface Segregation.
    *   Implement Dependency Inversion.
3.  **State Management Refinement (Zustand):**
    *   Review all Zustand stores (`useTripStore`, `useTodoStore`, `useChatStore`, `useLocationStore`) after they are moved into their respective feature folders.
    *   Ensure stores are focused and don't manage unrelated state.
    *   Abstract asynchronous logic (API calls) from stores into feature services.
4.  **Navigation System Refinement (Expo Router):**
    *   Consolidate routing with a proper root layout (`app/_layout.tsx`).
    *   Implement typed routes.
    *   Review and improve deep linking setup (e.g., `nomadcrew://auth/callback`).
5.  **Component Refactoring & UI System:**
    *   Review and refactor shared components in `src/components/`.
    *   Ensure consistent use of React Native Paper and the custom theme system.
    *   Implement responsive design practices using Flexbox and `useWindowDimensions`.
6.  **API Service Layer & Data Fetching:**
    *   Standardize API interaction through feature-specific services.
    *   Refactor `WebSocketManager` and SSE logic, potentially abstracting them into a shared real-time service or integrating them into feature services.
7.  **Performance Optimization:**
    *   Identify and apply optimizations (FlashList, lazy loading, memoization) as part of feature refactoring.
8.  **Testing Strategy:**
    *   Establish Jest unit test setup.
    *   Begin writing unit tests for services, stores, and critical utility functions.
9.  **Coding Standards & Tooling Setup:**
    *   Customize and enforce ESLint rules strictly.
    *   Integrate and configure Prettier.
    *   Set up Git hooks (Husky).

## ❗ Active Decisions / Context

-   The refactor is following the feature-first structure outlined in the provided guide.
-   The `auth` module is the first to undergo this refactoring.
-   Tool limitations with reading large files were encountered for `useAuthStore.ts` but resolved by the user providing full content.
-   `secure-unlimited-store.ts` remains within `src/features/auth/` as it seems specific to auth token management.
-   The process involves moving files, then refactoring their internal structure (service, store, types), then updating imports.

-   **New Rule: No Barrel Files for Application Imports.** To optimize bundle size and build times, internal application imports must be direct. Existing barrel files (`auth`, `chat`) will be refactored. See [article](https://dev.to/tassiofront/barrel-files-and-why-you-should-stop-using-them-now-bc4).