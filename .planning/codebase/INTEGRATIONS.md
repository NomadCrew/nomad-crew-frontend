# External Integrations

**Analysis Date:** 2026-01-10

## APIs & External Services

**Backend API:**
- NomadCrew Backend - Core application API
  - SDK/Client: Axios via `src/api/api-client.ts`
  - Base URL: Configured via environment (development/production)
  - Auth: Bearer token in Authorization header
  - Endpoints: Trips, users, invitations, todos, chat

**Supabase:**
- Supabase - Authentication, real-time, and database
  - SDK/Client: `@supabase/supabase-js` 2.86 (`src/api/supabase.ts`)
  - URL: `https://efmqiltdajvqenndmylz.supabase.co` (via `EXPO_PUBLIC_SUPABASE_URL`)
  - Auth: Anon key via `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - Features: Auth, Realtime channels

## Data Storage

**Databases:**
- Supabase PostgreSQL - Backend data (via API)
  - Connection: Via Supabase client
  - Access: Through backend API, not direct DB access

**Local Storage:**
- AsyncStorage - Non-sensitive app data
  - SDK: `@react-native-async-storage/async-storage`
  - Usage: Onboarding state, cached data, pending invitations

**Secure Storage:**
- Expo SecureStore - Sensitive data (tokens)
  - SDK: `expo-secure-store` (`src/features/auth/store.ts`)
  - Usage: Access tokens, refresh tokens
  - Key: `supabase_access_token`

**Query Cache:**
- TanStack Query - Server state caching
  - SDK: `@tanstack/react-query` with persister
  - Config: `src/lib/query-client.ts`
  - Persistence: Sync storage persister

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Primary authentication
  - Implementation: `@supabase/supabase-js` client
  - Token storage: SecureStore via `expo-secure-store`
  - Session: JWT with auto-refresh via `onAuthStateChange`
  - State: Managed in `src/features/auth/store.ts`

**OAuth Integrations:**

**Google OAuth:**
- `@react-native-google-signin/google-signin`
- Credentials (configured in `eas.json`, `app.config.js`):
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
  - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
  - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- Scopes: email, profile
- Hook: `src/hooks/useGoogleSignIn.ts`

**Apple Sign-In:**
- `@invertase/react-native-apple-authentication`
- `expo-apple-authentication`
- Config in `app.config.js`:
  - Service ID: `com.nomadcrew.app.signin`
  - Team ID: `27DC66D35A`
- Hook: `src/hooks/useAppleSignIn.ts`

## Maps & Location

**Google Maps:**
- react-native-maps - Map display
  - SDK: `react-native-maps` 1.18
  - API Keys:
    - iOS: `EXPO_PUBLIC_GOOGLE_API_KEY_IOS`
    - Android: `EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID`
  - Config: `app.config.js` (ios.config.googleMapsApiKey, android.config.googleMaps)

**Google Places:**
- expo-google-places-autocomplete - Place search
  - SDK: `expo-google-places-autocomplete` 1.2
  - API Keys: Same as Maps
  - Config: `app.config.js` (googlePlacesApiKey)

**Location Services:**
- Expo Location - Geolocation
  - SDK: `expo-location` 18.0
  - Permissions: Always and when-in-use
  - Store: `src/features/location/store/useLocationStore.ts`

## Push Notifications

**Expo Notifications:**
- Push notification handling
  - SDK: `expo-notifications` 0.29
  - Token registration: `src/features/auth/store.ts` (`registerPushToken`)
  - Store: `src/features/notifications/store/useNotificationStore.ts`
  - Services: `src/features/notifications/services/pushNotificationService.ts`
  - Project ID: `50d59d51-34e0-49ab-a7ee-6989ed09f8ef` (EAS)

## CI/CD & Deployment

**Hosting:**
- Apple App Store - iOS distribution
  - Apple ID: `naqeebali.shamsi@gmail.com`
  - ASC App ID: `6743161123`
  - Team ID: `27DC66D35A`

- Google Play Store - Android distribution
  - Service account: `./android/service-account.json`
  - Track: production

**CI Pipeline:**
- EAS Build - Cloud builds
  - Profiles: development, development-simulator, preview, production
  - Config: `eas.json`
  - CLI version: >= 14.2.0

**Build Profiles:**
- `development`: Debug builds with dev client, APK for Android
- `development-simulator`: iOS simulator builds
- `preview`: Internal testing, APK
- `production`: Store builds, auto-increment version, app-bundle for Android

## Environment Configuration

**Development:**
- Required env vars:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_GOOGLE_*` (API keys, client IDs)
  - `EXPO_PUBLIC_PROJECT_ID` (for push tokens)
- Secrets location: Environment variables, EAS secrets
- Bundle ID: `com.nomadcrew.app.dev`

**Production:**
- Same env vars with production values
- Bundle ID: `com.nomadcrew.app`
- Secrets: EAS environment variables
- Auto version increment via EAS

## Deep Linking

**URL Schemes:**
- Custom scheme: `nomadcrew://`
- Web domain: `nomadcrew.uk`

**Intent Filters (Android):**
- Auth callback: `https://nomadcrew.uk/auth/callback`
- Supabase callback: `https://eihszqnmmgbrcxtymskn.supabase.co/auth/v1/callback`
- Invite accept: `nomadcrew://invite/accept/*`, `https://nomadcrew.uk/invite/accept/*`

**Associated Domains (iOS):**
- `applinks:nomadcrew.uk`

## Real-time & WebSocket

**Supabase Realtime:**
- Channel subscriptions for live updates
- Events: Trip updates, chat messages, location sharing
- Manager: `src/features/websocket/WebSocketManager.ts`

**Event Types:**
- Trip events: `TRIP_CREATED`, `TRIP_UPDATED`, `TRIP_DELETED`
- Chat events: `MESSAGE_CREATED`, `MESSAGE_UPDATED`
- Todo events: `TODO_CREATED`, `TODO_UPDATED`, `TODO_COMPLETED`
- Location events: `LOCATION_UPDATED`

---

*Integration audit: 2026-01-10*
*Update when adding/removing external services*
