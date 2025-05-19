# Active Context

## ✅ Recent Changes / Decisions (as of Current Date)

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

1.  **Resolve Persistent Linter Errors (if any):**
    *   Address any remaining linter errors, particularly "Cannot find module..." errors. This might involve restarting the TypeScript server or verifying the `node_modules` integrity.
2.  ✅ **Address Codebase Comments:**
    *   Systematically reviewed and addressed `TODO`, `FIXME`, and other relevant comments left in the codebase.
    *   Moved `getUserDisplayName` from trips store to a proper utility file in auth feature.
    *   Fixed the temporary activeTripId hardcoding in location store.
    *   Removed and documented the deprecated DateSeparator logic in ChatList component.
3.  **Backend: Push Token Deregistration Endpoint:**
    *   (Backend Task) Implement the backend endpoint (e.g., `/users/push-token/deregister`) that the `logout` function in `useAuthStore` calls.
4.  **Thorough Testing & Validation (Authentication):**
    *   Test all authentication flows: email/password (login, register), Google Sign-In, Apple Sign-In.
    *   Verify token persistence in SecureStore and correct behavior across app restarts.
    *   Test `onAuthStateChange` listener scenarios.
    *   Confirm 401 interceptor correctly refreshes token and retries requests.
    *   Test logout thoroughly: SecureStore cleared, push token deregistered (verify backend), state reset.
    *   Test error handling for all auth operations.
5.  **Review `registerAuthHandlers` (Final Check):**
    *   After full testing, give a final confirmation that the `registerAuthHandlers` integration and functionality are as expected.
6.  **Documentation Finalization:** Update internal developer documentation.

## ❗ Active Decisions / Context
- The API client interceptor in `src/api/api-client.ts` is considered sufficient for 401 handling and token refresh.
- Primary focus shifting to resolving codebase comments and then thorough testing of the auth system.
- The `registerAuthHandlers` function in `src/api/api-client.ts` is essential and has been correctly integrated with `useAuthStore`.
- `secure-unlimited-store.ts` and `SecureTokenManager` have been removed as they are obsolete.
- `expo-secure-store` is the standard for access token storage, managed within `useAuthStore`.