# Active Context

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

## 🧠 Next Steps

1. Test the authentication system:
   - Verify auth guards redirect unauthenticated users to login
   - Test session refresh mechanism
   - Validate deep linking for auth callbacks (OAuth, email verification)
   - Test user session persistence across app restarts

2. Enhance authentication user experience:
   - Add clear error handling and user feedback for authentication failures
   - Create Toast/Alert components for auth errors
   - Improve error messages and recovery options

3. Complete testing of the application on device/emulator to verify authentication guards and routing are working properly.

4. Refine the deep linking implementation for authentication flows:
   - Test the auth/callback handling for OAuth and email verification
   - Add support for additional authentication scenarios (password reset, invitation acceptance)

5. Continue with Phase 2 of the refactoring plan: Core Logic & Pattern Implementation.