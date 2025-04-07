# NomadCrew Frontend Project Context

## Latest Updates

### April 9, 2024, 20:30 UTC
- Fixed CreateTripModal autocomplete and theme integration:
  - Replaced basic text input with proper CustomPlacesAutocomplete component
  - Fixed the destination search functionality for location selection
  - Enhanced modal styling to follow app's theme system
  - Improved component responsiveness and user experience
  - Added proper theming for all UI elements in the modal

### Files Modified
- UI Components:
  - `components/trips/CreateTripModal.tsx` (fixed autocomplete, added theming)
  - `components/PlacesAutocomplete.tsx` (added initialValue support)

### April 4, 2024, 18:40 UTC
- Improved UI for trip creation and notifications:
  - Moved the create trip functionality from the top button group to a FAB (Floating Action Button)
  - Added a dedicated notifications tab to the bottom navigation bar with badge indicator
  - Relocated the notifications bell from the trips screen to the main tab navigation
  - Cleaned up the trips screen header for a more focused interface
  - Enhanced navigation consistency across the application

### Files Modified/Created
- Navigation:
  - `app/(tabs)/_layout.tsx` (added notifications tab with badge in bottom navigation)
  - `app/(tabs)/notifications.tsx` (created new tab screen for notifications)
- UI Components:
  - `app/(tabs)/trips.tsx` (replaced top button with FAB, removed NotificationBell)

### March 21, 2024, 15:45 UTC
- Fixed in-app notification system:
  - Updated NotificationProvider to use Zustand v5.0.1's subscription API correctly
  - Created custom hook for testing notifications (useTestNotifications)
  - Added test controls to the Notifications screen
  - Enhanced notification toast display logic
  - Improved state handling for notification queue management

### Files Created/Modified
- New Components:
  - `src/components/notifications/NotificationTestButton.tsx` (test controls)
- New Hooks:
  - `src/hooks/useTestNotifications.ts` (notification testing hook)
- Modified Components:
  - `src/components/notifications/NotificationProvider.tsx` (fixed subscription)
  - `src/components/notifications/index.ts` (added export)
  - `app/notifications.tsx` (added test section)

### March 19, 2024, 17:30 UTC
- Implemented in-app notification system with focus on trip invites:
  - Created Zustand notification store for managing notifications
  - Built UI components for displaying notifications (toast, badge, list)
  - Added WebSocket integration for real-time notifications
  - Created a dedicated notifications screen
  - Added notification bell to the Trips screen
  - Implemented accept/decline functionality for trip invites
  - Added persistence with AsyncStorage for offline access

### Files Created
- Types:
  - `src/types/notification.ts` (notification types and schemas)
- Store:
  - `src/store/useNotificationStore.ts` (notification state management)
- Components:
  - `src/components/notifications/NotificationBadge.tsx` (unread count badge)
  - `src/components/notifications/NotificationBell.tsx` (notification bell icon)
  - `src/components/notifications/NotificationItem.tsx` (individual notification)
  - `src/components/notifications/NotificationList.tsx` (list of notifications)
  - `src/components/notifications/NotificationToast.tsx` (toast notifications)
  - `src/components/notifications/NotificationProvider.tsx` (provider component)
  - `src/components/notifications/index.ts` (barrel file)
- Screens:
  - `app/notifications.tsx` (notifications screen)

### Files Modified
- WebSocket Management:
  - `src/websocket/WebSocketManager.ts` (added trip invite event handling)
- Types:
  - `src/types/events.ts` (added TRIP_INVITE event type)
- App Layout:
  - `app/_layout.tsx` (added NotificationProvider)
  - `app/(tabs)/trips.tsx` (added notification bell to header)

### March 16, 2024, 16:30 UTC
- Implemented read receipts in chat functionality:
  - Added read receipt tracking in the chat store
  - Updated WebSocketManager to handle read receipt events
  - Enhanced ChatMessage component to display read status
  - Implemented automatic marking of messages as read when viewed
  - Added persistence for read receipts and last read message IDs
  - Updated theme system to include read receipt styling

### Files Modified
- Chat Components:
  - `components/chat/ChatMessage.tsx` (added read receipt display)
  - `components/chat/ChatList.tsx` (added automatic read receipt triggering)
  - `screens/chat/ChatScreen.tsx` (updated to pass tripId to ChatList)
  - `screens/chat/MobileChatScreen.tsx` (updated to pass tripId to ChatList)
- State Management:
  - `src/store/useChatStore.ts` (added read receipt functionality)
  - `src/types/chat.ts` (added read receipt types)
- WebSocket:
  - `src/websocket/WebSocketManager.ts` (added read receipt handling)
- Theme:
  - `src/theme/foundations/colors.ts` (added read receipt styling)

### March 16, 2024, 15:00 UTC
- Fixed Google Sign-In issue on iOS development builds:
  - Modified app.config.js to include both development and production URL schemes in CFBundleURLTypes
  - Removed conditional logic for URL schemes to ensure both are always present
  - Maintained conditional iosUrlScheme in the Google Sign-In plugin configuration
  - Resolved "Your app is missing support for the following URL schemes..." error

### Files Modified
- Configuration:
  - `app.config.js` (updated CFBundleURLTypes to include all URL schemes)

### March 14, 2024, 14:30 UTC
- Fixed iOS build failure related to Google Services file:
  - Reverted app.config.js to use standardized GoogleService-Info.plist files
  - Ensured GoogleService-Info.dev.plist is tracked by Git for EAS Build
  - Aligned configuration with EAS Build expectations

### Files Modified/Actions Taken
- Configuration:
  - `app.config.js` (updated googleServicesFile paths to use standardized file names)
  - Added `ios/GoogleService-Info.dev.plist` to Git tracking

### March 14, 2024, 14:00 UTC
- Fixed iOS build failure related to Google Services file:
  - Updated app.config.js to use the correct Google Services file paths
  - Aligned configuration with the actual file names in the iOS directory
  - Resolved the ENOENT error during prebuild process

### Files Modified
- Configuration:
  - `app.config.js` (updated googleServicesFile paths to match actual file names)

### March 14, 2024, 13:15 UTC
- Removed staging environment (deprecated):
  - Updated app.config.js to only use development and production environments
  - Modified eas.json to remove staging build and submit profiles
  - Simplified environment configuration to a two-environment setup

### Files Modified
- Configuration:
  - `app.config.js` (removed staging environment references)
  - `eas.json` (removed staging build and submit profiles)

### March 14, 2024, 12:40 UTC
- Fixed iOS build error related to GoogleService-Info.plist:
  - Created standardized GoogleService-Info.plist files for all environments
  - Updated app.config.js to use the standardized file names
  - Modified .gitignore to ensure Google service files are tracked by Git
  - Ensured EAS Build can access the required files

### Files Modified/Created
- iOS Configuration:
  - `ios/GoogleService-Info.plist` (standardized from custom-named file)
  - `ios/GoogleService-Info.dev.plist` (standardized from custom-named file)
  - `ios/GoogleService-Info.staging.plist` (standardized from custom-named file)
- Configuration:
  - `app.config.js` (updated googleServicesFile paths)
  - `.gitignore` (added exception for GoogleService-Info.plist files)

### March 14, 2024, 10:00 UTC
- Fixed iOS authentication issues:
  - Added Google Sign-In URL scheme to Info.plist
  - Created environment-specific Google client configuration files
  - Updated Apple Sign-In serviceId to match bundle identifiers for each environment
  - Fixed bundle identifier mismatches in authentication configuration

### Files Modified/Created
- iOS Configuration:
  - `ios/nomad-crew-frontend/Info.plist` (added Google Sign-In URL scheme)
  - `ios/client_369652278516-05kcrkp3l28g4lt0hhki48othfgug3nc.apps.googleusercontent.com.dev.plist` (new)
  - `ios/client_369652278516-05kcrkp3l28g4lt0hhki48othfgug3nc.apps.googleusercontent.com.staging.plist` (new)
- App Configuration:
  - `app.config.js` (updated Apple Sign-In and Google services configuration)

### March 13, 2024, 18:30 UTC
- Implemented production readiness setup:
  - Added environment management with `.env.development`, `.env.staging`, and `.env.production`
  - Updated `app.config.js` to handle different environments
  - Updated `eas.json` with proper build profiles for development, staging, and production
  - Set up testing infrastructure with Jest and React Testing Library
  - Added CircleCI configuration for CI/CD pipeline
  - Created test utilities and mocks for theme system

### Files Modified/Created
- Environment Files:
  - `.env.development`
  - `.env.staging`
  - `.env.production`
  - `.env.example`
- Configuration:
  - `app.config.js` (updated for environment handling)
  - `eas.json` (updated build profiles)
  - `.circleci/config.yml` (new CI/CD pipeline)
- Testing:
  - `__tests__/test-utils.tsx`
  - `__tests__/mocks/theme-compatibility.ts`
  - `jest.setup.js`
  - Updated component tests to use new test utilities

### May 19, 2024, 14:00 UTC (Placeholder Date - Please Adjust)
- Finalized notification system plan with backend:
  - Confirmed backend as source of truth; frontend uses API calls for sync.
  - API Endpoints:
    - Mark read (single): `PATCH /api/notifications/:id`
    - Mark all read: `PATCH /api/notifications` (Body: `{"status": "read"}`)
    - Get unread count: `GET /api/notifications/count?status=unread`
    - Fetch notifications: `GET /api/notifications` (Params: `limit`, `offset`, `status`)
  - Metadata: Agreed on structure for `TRIP_INVITATION`, `CHAT_MESSAGE`, `TRIP_MEMBER_ADDED`. Frontend to assume structure is provided.
  - WebSocket Contract: Backend sends full notification object; frontend acknowledges.
  - Chat Notifications (`CHAT_MESSAGE`): Display Toast notification only if user is not actively viewing the specific chat screen; do not create a persistent list item; update relevant notification badges.
  - Caching: Implement local cache in AsyncStorage for the latest 100 notifications, pruning the oldest when the limit is exceeded.
  - Actions: Frontend will call specific business logic endpoints (e.g., `/invitations/:id/accept`) provided by the backend.

### Files Modified/Created (Planned)
- State Management:
  - `src/store/useNotificationStore.ts` (creation or major update)
- API Client:
  - Update/create functions for new notification endpoints.
- WebSocket Handling:
  - Update `src/websocket/WebSocketManager.ts` for new notification types and chat logic.
- UI Components:
  - `src/components/notifications/NotificationBell.tsx` (integrate unread count)
  - `src/components/notifications/NotificationList.tsx` (integrate fetching/pagination)
  - `src/components/notifications/NotificationItem.tsx` (handle types, metadata, actions)
  - `src/components/notifications/NotificationToast.tsx` (implement chat strategy)
- Caching Logic:
  - Implement within store or dedicated utility.

## Project Structure

### Core Dependencies
- React Native with Expo SDK
- TypeScript
- Zustand for state management
- React Native Paper for UI components
- Custom theme system with light/dark mode support

### Environment Configuration
- Development: Local development environment with development client
- Production: Production environment with live APIs and App Store builds

### Build Configuration
- Development: Development client with hot reload
- Preview: Internal testing builds (using development environment)
- Production: App store builds

### Testing Strategy
- Jest for unit and integration tests
- React Testing Library for component testing
- Custom test utilities for theme and provider mocks
- CircleCI for automated testing

### Authentication
- Supabase for authentication
- Google OAuth integration
- Apple Sign-In support

### Deployment Pipeline
- CircleCI for automated builds and deployments
- Separate workflows for development, staging, and production
- Automated testing and linting checks

## Production Readiness Status

### Completed
- ✅ Environment management setup
- ✅ Testing infrastructure
- ✅ CI/CD pipeline configuration

### In Progress
- 🟡 Certificate & provisioning profile management
- 🟡 Security implementation
- 🟡 Release strategy

### Pending
- ⚪ Monitoring and analytics
- ⚪ Error tracking
- ⚪ Performance optimization

## Next Steps
1. Set up fastlane for iOS and Android certificate management
2. Implement Sentry for error tracking
3. Configure app signing and versioning strategy

## Updates

- March 14, 2023, 16:00 UTC: Simplified CreateTripModal and PlacesAutocomplete components by removing excessive memoization, debug logging, and performance optimizations. Introduced a reusable AutocompleteRow component to modularize row rendering in PlacesAutocomplete.

## March 18, 2025, 15:30 UTC
- Added map troubleshooting guide for Android
- Fixed map rendering issue on Android physical devices

## Map Configuration Guide

### Android Google Maps API Key Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to APIs & Services > Credentials
4. Find your Android Maps API key
5. Click Edit
6. Add the SHA-1 certificate fingerprints:
   - For debug builds: Get your debug SHA-1 with:
     ```
     cd android && ./gradlew signingReport
     ```
   - For production builds: Add the signing key SHA-1 fingerprint

7. Make sure your API key has these APIs enabled:
   - Maps SDK for Android
   - Places API
   - Geocoding API

### Common Issues
- **Blank map on Android**: Usually caused by missing SHA-1 certificate in API key restrictions
- **Map loads on iOS but not Android**: Different configuration requirements between platforms
- **Map crashes on Android**: Check logcat for specific error messages

### Configuration Best Practices
- Use separate API keys for iOS and Android
- Restrict API keys by app package name and SHA-1 fingerprint
- For production, create separate keys for debug and release builds

## June 10, 2025, 15:45 UTC - Implemented Comprehensive Notification System

Enhanced the app's notification system to support all backend event types:

- Extended `notification.ts` with interfaces for all notification types:
  - Trip invites, updates and status changes
  - Todo creation, updates, and completion
  - Member addition, removal, and role changes
  - Weather updates and alerts
  - Chat messages and reactions
  - Location updates

- Updated `useNotificationStore` with handlers for all event types
- Improved the `WebSocketManager` to route all events to the notification store
- Enhanced notification UI components to display type-specific content:
  - Added custom icons and content for each notification type
  - Implemented appropriate navigation based on notification type
  - Added user-friendly formatting and styling

This implementation provides a complete real-time notification system that integrates with the backend's WebSocket-based event infrastructure, delivering a seamless user experience for all collaborative app features.
