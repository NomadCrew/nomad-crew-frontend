# Active Context

## ✅ Recent Changes / Decisions (as of Current Date)

- **"Screen Doesn't Exist" Issue After Restart Resolved:**
    - Fixed an issue where restarting the app would lead to a "This screen doesn't exist" error.
    - The problem was caused by an incorrect redirect path in `app/index.tsx`. It was redirecting to the `(tabs)` layout group generally, instead of a specific default screen within that group (e.g., `(tabs)/trips`).
    - Corrected the redirect in `app/index.tsx` to point to `/(tabs)/trips` (or the appropriate default tab screen).
    - This ensures that after the initial app setup and when not a first-time launch, the app correctly navigates to a valid, existing screen.

- **Username Onboarding Infinite Redirect Issue Resolved:**
    - Fixed the infinite redirect loop and username screen skipping issues related to username setup after social login/registration.
    - The core change was made in `src/features/auth/store.ts`:
        - During session initialization (`initialize`), login (`handleGoogleSignInSuccess`, `handleAppleSignInSuccess`), and registration, if `needsUsername` is determined to be `true` (because the backend user profile is missing or has no username), the `user` object in the store is *no longer set to null*.
        - Instead, the `user` object is populated with the authenticated user's information from the Supabase session, ensuring that `status` remains `'authenticated'` and is accompanied by user data.
        - The `needsUsername` flag is now the sole, reliable indicator for requiring username setup.
    - This ensures `OnboardingGate.tsx` can consistently act as the single source of truth for gating access to the username screen.
    - `AuthGuard.tsx` now correctly interprets the auth state, as `user` is not prematurely nulled, allowing its logic (which defers to `OnboardingGate` when `needsUsername` is true) to function as intended.
    - This prevents conflicts between `AuthGuard` and `OnboardingGate` that previously led to redirect loops or incorrect navigation.

- **Onboarding/Username Bug Identified:**
    - On fresh install and new user sign-in (including Google), the app does not present the username onboarding screen, even when the backend user has no username set.
    - Debug logs confirm: after Google sign-in, the backend returns a user profile with a username field (e.g., "hrkadushmann"), but this is auto-generated from the email prefix, not user-chosen.
    - The frontend logic only checks for the presence of a non-empty username to skip the username onboarding step, so users never get a chance to set a custom username if one is auto-generated.
    - This results in users being routed directly to the home screen after login, with no opportunity to set or change their username.
    - The bug is confirmed by both the logs and the absence of a username on the profile page after onboarding.
    - The backend `/v1/users/me` endpoint is working as expected and returns the current user profile.

- **Startup Crash & Navigation Flow Fixed:**
    - Resolved app startup crash previously caused by a combination of font loading errors and navigation conflicts between `OnboardingGate` and `AuthGuard`.
    - Corrected font loading paths in `app/AppInitializer.tsx` for Manrope fonts and temporarily commented out Inter fonts (due to missing static files) to allow bundling.
    - Modified `src/components/common/OnboardingGate.tsx` to correctly use `useSegments` (from Expo Router) instead of `usePathname` for accurately detecting if a route belongs to the `(auth)` or `(onboarding)` layout groups. This ensures the gate allows navigation to necessary auth screens during the first-time flow.
    - Updated `src/features/auth/components/AuthGuard.tsx` to prevent premature redirection from `(onboarding)` routes for unauthenticated users. This ensures the onboarding flow is presented to new users before any login prompts from the guard.
    - Confirmed that Expo Router's `usePathname()` returns a canonical path (e.g., `/login`), while `useSegments()` returns an array including layout group segments (e.g., `['(auth)', 'login']`), making `useSegments()` essential for route guards that need to be aware of layout groups.
- **API Client Integration Confirmed:**
    - Reviewed `src/api/api-client.ts` and confirmed its existing interceptor logic for 401s and token refresh is robust.
    - Ensured `registerAuthHandlers` is now called in `src/features/auth/store.ts` to properly connect the auth store with the API client, enabling the interceptors.
- **Auth Code Cleanup Completed:**
    - Deleted deprecated `src/features/auth/secure-unlimited-store.ts`.
    - Removed the superseded `SecureTokenManager` class from `src/features/auth/service.ts`.
- **Linter Errors Addressed in Auth Store:**
    - Corrected import paths in `src/features/auth/store.ts`.
    - Added explicit types for `onAuthStateChange` parameters (`event`, `session`) and `set` callback parameters (`prevState`).
    - Updated `src/features/auth/types.ts` by adding `registerPushToken` to the `AuthState` interface to resolve type errors.
- **Central Data Normalization (Adapter Pattern) Adopted:**
    - All backend data will be normalized through a dedicated adapter function before entering Zustand state or UI.
    - This ensures type safety, prevents UI errors, and centralizes backend quirks handling.
    - First implementation will be for trips: create a `TripAdapter` (e.g., `normalizeTrip`) and refactor trip store/service to use it.

## ✅ Recent Changes

- **Implemented Authentication System:**
  - Implemented `AuthGuard` component for route protection based on authentication status
  - Created `AuthProvider` to manage auth state and deep linking for authentication flows
  - Added token refresh mechanism and proper redirection based on auth status
  - Integrated auth guards into the app's root layout for comprehensive protection
  - Implemented deep link handling for authentication callbacks
  - Set up proper authentication initialization with error handling

- **Updated API Endpoints with Version Prefix:**
  - Added the `/v1` prefix to all API endpoint calls in the notification store.
  - Updated invitation endpoints to use the correct version path.
  - This should resolve the 404 errors when calling the API.

- **Fixed Chat Routing and API Endpoints:**
  - Fixed routing warning by updating chat route in app/_layout.tsx to use the correct name.
  - Updated notification API endpoints to match the documented API on `docs.nomadcrew.uk`.
  - Modified the fetchUnreadCount function to use the main notifications endpoint with a status filter.
  - Updated markNotificationRead and markAllNotificationsRead to use the correct endpoints.

- **Fixed API Client Error in Notifications:**
  - Fixed issue where `apiClient.get` was being used instead of `api.get` in the notifications store.
  - Updated import in the NotificationStore to include both `apiClient` and `api`.
  - Replaced all instances of `apiClient.get/post/patch` with `api.get/post/patch` in the notification store.
  - Fixed the property names in NotificationList component to match the actual store properties.
  - This resolves the error: `[fetchUnreadCount failed:] [TypeError: _apiClient.apiClient.get is not a function (it is undefined)]`

- **Fixed Zod Discriminated Union Error:**
  - Identified and fixed a Zod schema error in `src/features/notifications/types/notification.ts`.
  - Replaced the fallback `z.string()` with `z.literal('UNKNOWN')` in the ZodNotificationSchema.
  - Added a dedicated NotificationTypeEnum to define all notification types as a Zod enum.
  - Updated the GenericNotification type and added an isGenericNotification type guard.
  - This resolved the error: "A discriminator value for key 'type' could not be extracted from all schema options".

- **Fixed Import Issues for Component Building:**
  - Created `src/components/ThemedText.tsx` component to resolve missing imports.
  - Created `src/components/ThemedView.tsx` component for consistent UI components.
  - Created `src/components/ui/WeatherIcon.tsx` component using the existing WeatherCondition type.
  - Fixed imports in `src/features/trips/components/TripDetailHeader.tsx` to use the correct paths.
  - Updated import in `components/HelloWave.tsx` to point to the new component location.

- **Fixed App Navigation Structure:**
  - Created the missing `app/(tabs)` directory structure.
  - Implemented a proper tab navigation setup in `app/(tabs)/_layout.tsx`.
  - Created basic tab screens for Trips, Profile, Location, and Notifications.
  - Fixed root `_layout.tsx` to properly nest navigation and providers.
  - Created the LoadingScreen component in src/components/common/ directory.
  - Updated imports in dependent files to use the new component paths.

- **WebSocket Module Refactor (Complete):**
  - Created `src/features/websocket/` directory.
  - Moved `src/websocket/WebSocketManager.ts` to `src/features/websocket/WebSocketManager.ts`.
  - Moved `src/websocket/WebSocketConnection.ts` to `src/features/websocket/WebSocketConnection.ts`.
  - Created `src/features/websocket/types.ts` with WebSocket-specific types and re-exports from global events.ts.
  - Updated import paths in WebSocketManager and WebSocketConnection.
  - Updated references to WebSocketManager throughout the codebase to use the new path.
  - Fixed TypeScript linter error related to untyped err parameter.

- **Cleanup of Obsolete Files & Directories:**
  - Deleted empty directories: `components/location/`, `components/todo/`, `components/chat/`.
  - Removed obsolete backup directory `app/(tabs)-bkp/`.
  - Replaced `app/index.tsx` TestScreen implementation with a proper redirect to the main app.
  - Removed app/notifications.tsx (now handled in the tabs structure).

- **Global Utilities Consolidation:**
  - Moved `src/utils/notifications.ts` to `src/features/notifications/utils/notifications.ts`. Deleted the original file.
  - Deleted redundant `components/trips/TripDetailHeader.tsx` file (already exists in `src/features/trips/components/`).
  - Removed empty `components/trips/` directory.

- **Notifications Module Refactor (Complete):**
  - Moved `useNotificationStore.ts` to `src/features/notifications/store/`.
  - Moved notification components (`NotificationBadge.tsx`, `NotificationBell.tsx`, `NotificationItem.tsx`, `NotificationList.tsx`, `NotificationProvider.tsx`, `NotificationTestButton.tsx`, `NotificationToast.tsx`) from `src/components/notifications/` to `src/features/notifications/components/`.
  - Moved `useTestNotifications.ts` hook from `src/hooks/` to `src/features/notifications/hooks/`.
  - Moved `notification.ts` types from `src/types/` to `src/features/notifications/types/`.
  - Updated all relevant import paths.
  - Deleted original files and old `src/components/notifications/index.ts` barrel file.
  - Corrected unused type imports in `NotificationProvider.tsx`.

- **WebSocket Event Handling:** 
  - Refined WebSocket `onMessage` handler in `TripDetailScreen.tsx` to correctly parse and route `ServerEvent` and `Notification` types to their respective stores, resolving linter errors.

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

- **Addressed TODO Comments in Codebase:**
  - Moved `getUserDisplayName` from `trips/store.ts` to `auth/utils.ts` for better code organization
  - Improved location tracking in `location/store/useLocationStore.ts` by getting active trip ID from the trip store
  - Removed commented-out DateSeparator logic in `chat/components/ChatList.tsx` with documentation about the better approach

## ✅ Recent Changes / Decisions (as of October 26, 2023)

- **Finalized Authentication Strategy:** Shifted to primarily using `expo-secure-store` for JWT access token storage, leveraging its hardware-backed encryption. Supabase client will continue to use its internal `AsyncStorage` for its own session and refresh token management.
- **Custom AsyncStorage Encryption (for Auth Tokens) Deprioritized:** The `secure-unlimited-store.ts` and `SecureTokenManager` for encrypting auth tokens in AsyncStorage are no longer the primary approach for access tokens, as they fit in SecureStore. These may be removed or repurposed.
- **Social Login Hooks Updated:** `useGoogleSignIn.ts` and `useAppleSignIn.ts` now integrate with `expo-secure-store` for saving the access token post-Supabase authentication and call new handlers in `useAuthStore` (`handleGoogleSignInSuccess`, `handleAppleSignInSuccess`).
- **`useAuthStore` Enhancements:** 
    - Integrated `expo-secure-store` for all access token operations (save on login/refresh, load on init, delete on logout).
    - Added `handleGoogleSignInSuccess` and `handleAppleSignInSuccess` methods.
    - Implemented a comprehensive `logout` method including push token deregistration (frontend part) and SecureStore cleanup.
    - Added `supabase.auth.onAuthStateChange` listener to keep store and SecureStore synced with Supabase events (`SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, `USER_UPDATED`).

## 🧠 Next Steps

1. **Coordinate with Backend:**
    - Confirm with the backend team if the username should ever be auto-generated, or if the field should be left empty until the user sets it.
    - If auto-generation is required, agree on a pattern (e.g., email prefix) so the frontend can detect and prompt for a custom username.
2. **Thorough Testing & Validation (Authentication & Onboarding):**
    - Test all authentication flows: email/password (login, register), Google Sign-In, Apple Sign-In.
    - Verify token persistence in SecureStore and correct behavior across app restarts.
    - Test `onAuthStateChange` listener scenarios.
    - Confirm 401 interceptor correctly refreshes token and retries requests.
    - Test logout thoroughly: SecureStore cleared, push token deregistered (verify backend), state reset.
    - Test error handling for all auth operations.
    - Test the complete onboarding flow now that navigation is unblocked. Ensure `isFirstTime` flag in `OnboardingProvider` is correctly set/reset.
    - Specifically test the resolved username onboarding flow:
        - New user registration (email/social) leading to username screen.
        - Session restore for user who hasn't set username, leading to username screen.
        - User attempts to navigate away from username screen before completion.
    - Test the resolved "Screen Doesn't Exist" issue by restarting the app under various conditions (e.g., after login, after completing onboarding).
3. **Investigate API Calls for Unauthenticated Users:**
    - Review API calls like `fetchUnreadCount` that might be triggered for unauthenticated users (e.g., on the login screen or during initial app load before full auth state is settled).
    - Ensure these calls are either deferred until authentication or handled gracefully if made by unauthenticated users.
4. **Implement Central Data Normalization for Trips:**
    - Create `src/features/trips/adapters/normalizeTrip.ts` with a normalization function for trip data.
    - Refactor trip store/service to use this adapter for all trip data entering the app state/UI.
5. **Backend: Push Token Deregistration Endpoint:**
    - (Backend Task) Implement the backend endpoint (e.g., `/users/push-token/deregister`) that the `logout` function in `useAuthStore` calls.
6. **Review `registerAuthHandlers` (Final Check):**
    - After full testing, give a final confirmation that the `registerAuthHandlers` integration and functionality are as expected.
7. **Documentation Finalization:** Update internal developer documentation based on recent changes and learnings.
8. **Resolve Persistent Linter Errors (if any):**
    - Address any remaining linter errors.

## ❗ Active Decisions / Context
- The combined use of `app/index.tsx` for initial onboarding/app redirection, `OnboardingGate` (using `useSegments`) for protecting non-onboarding/non-auth routes during first-time use, and `AuthGuard` for general route protection and auth redirects is the current established pattern.
- `useSegments` is preferred over `usePathname` in route guards when layout group awareness is needed.
- The API client interceptor in `src/api/api-client.ts` is considered sufficient for 401 handling and token refresh.
- `expo-secure-store` is the standard for access token storage, managed within `useAuthStore`.