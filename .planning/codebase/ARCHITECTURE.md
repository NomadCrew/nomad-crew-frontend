# Architecture

**Analysis Date:** 2026-01-10

## Pattern Overview

**Overall:** Feature-Based React Native Application with Zustand State Management

**Key Characteristics:**
- Feature-modular architecture with self-contained feature directories
- File-based routing via Expo Router
- Zustand stores for state management per feature
- Real-time updates via Supabase channels
- Provider pattern for cross-cutting concerns

## Layers

**Routing Layer (app/):**
- Purpose: Define screens and navigation structure
- Contains: Page components, layouts, route definitions
- Location: `app/`, `app/(auth)/`, `app/(tabs)/`, `app/(onboarding)/`
- Depends on: Feature components, providers
- Used by: Expo Router (entry point)

**Feature Layer (src/features/):**
- Purpose: Self-contained feature modules with business logic
- Contains: Components, hooks, stores, types, services per feature
- Location: `src/features/auth/`, `src/features/trips/`, `src/features/chat/`, etc.
- Depends on: API layer, shared utilities
- Used by: Routing layer, other features (sparingly)

**API Layer (src/api/):**
- Purpose: Backend communication and data fetching
- Contains: API clients, error handling, Supabase client
- Location: `src/api/api-client.ts`, `src/api/supabase.ts`, `src/api/auth-api.ts`
- Depends on: External services (Supabase, backend API)
- Used by: Feature stores, services

**Component Layer (src/components/, components/):**
- Purpose: Reusable UI components
- Contains: Atoms, molecules, organisms, shared components
- Location: `src/components/atoms/`, `src/components/molecules/`, `components/common/`
- Depends on: Theme system
- Used by: Feature components, screens

**Theme Layer (src/theme/):**
- Purpose: Consistent styling and theming
- Contains: Theme definitions, Paper adapter, style utilities
- Location: `src/theme/`, `src/theme/foundations/`, `src/theme/utils/`
- Depends on: React Native Paper
- Used by: All components

**Provider Layer (src/providers/, app/):**
- Purpose: Cross-cutting concerns (auth, theming, query client)
- Contains: Context providers, error boundaries
- Location: `src/providers/OnboardingProvider.tsx`, `app/_layout.tsx`
- Depends on: Feature stores, libraries
- Used by: Root layout wrapping entire app

## Data Flow

**App Initialization:**

1. App launches, `app/_layout.tsx` renders provider hierarchy
2. `PersistQueryClientProvider` restores cached query data
3. `ThemeProvider` provides theme context
4. `OnboardingProvider` checks first-time status
5. `AbilityProvider` sets up CASL permissions
6. `AppInitializer` loads fonts, initializes auth, hides splash
7. Auth store checks Supabase session, restores user state
8. Navigation renders based on auth status

**User Authentication Flow:**

1. User taps login/signup in `app/(auth)/` screens
2. Component calls auth store method (`useAuthStore.login()`)
3. Store calls Supabase auth methods (`supabase.auth.signInWithPassword`)
4. On success, token stored in SecureStore (`expo-secure-store`)
5. Store updates user state, status changes to 'authenticated'
6. Supabase `onAuthStateChange` listener syncs state
7. Auth middleware redirects to authenticated routes

**Trip Data Flow:**

1. Screen component subscribes to `useTripStore`
2. Component calls `fetchTrips()` on mount
3. Store makes API call via `api.get(API_PATHS.trips.list)`
4. Response normalized via `normalizeTrip()` adapter
5. Store updates state, triggers component re-render
6. Real-time updates via Supabase channels update store

**State Management:**
- Zustand stores with devtools middleware
- Per-feature stores: `useAuthStore`, `useTripStore`, `useChatStore`, `useTodoStore`, `useLocationStore`, `useNotificationStore`
- React Query for server state caching (`@tanstack/react-query`)
- AsyncStorage for persistence of non-sensitive data
- SecureStore for tokens and sensitive data

## Key Abstractions

**Zustand Store:**
- Purpose: Feature-specific state management
- Examples: `src/features/auth/store.ts`, `src/features/trips/store.ts`
- Pattern: Single store per feature with actions and selectors
- Includes: State, actions, event handlers, persistence

**API Client:**
- Purpose: Centralized HTTP communication with auth handling
- Examples: `src/api/api-client.ts`
- Pattern: Axios instance with interceptors for auth tokens, retry logic
- Features: Automatic token refresh, error normalization

**Adapter/Normalizer:**
- Purpose: Transform backend data to frontend shape
- Examples: `src/features/trips/adapters/normalizeTrip.ts`
- Pattern: Pure function that maps and validates data
- Handles: Missing fields, type coercion, defaults

**Provider:**
- Purpose: React Context for cross-cutting concerns
- Examples: `src/theme/ThemeProvider.tsx`, `src/providers/OnboardingProvider.tsx`
- Pattern: Context + Provider component wrapping children

**Hook:**
- Purpose: Encapsulate reusable logic
- Examples: `src/hooks/useAuth.ts`, `src/hooks/useProtectedRoute.ts`, `src/hooks/useGoogleSignIn.ts`
- Pattern: Custom hooks composing other hooks and stores

## Entry Points

**App Entry:**
- Location: `app/_layout.tsx`
- Triggers: App launch via Expo
- Responsibilities: Setup providers, initialize app, render navigation

**Feature Stores:**
- Location: `src/features/*/store.ts`
- Triggers: Component import, store creation
- Responsibilities: Register auth handlers, setup listeners

**API Client:**
- Location: `src/api/api-client.ts`
- Triggers: First API call
- Responsibilities: Configure axios, setup interceptors

## Error Handling

**Strategy:** Error boundaries at provider level, try/catch in stores

**Patterns:**
- `AuthErrorBoundary` wraps app content (`components/AuthErrorBoundary.tsx`)
- Stores catch errors, set error state, log via logger
- API client handles HTTP errors, triggers refresh on 401
- Zod schemas validate event payloads (`src/types/events.ts`)

## Cross-Cutting Concerns

**Logging:**
- Custom logger utility (`src/utils/logger.ts`)
- Module-based log prefixes (AUTH, TRIP, CHAT, etc.)
- Conditional logging based on environment

**Validation:**
- Zod schemas for event validation (`src/types/events.ts`)
- TypeScript strict mode for compile-time checks
- Runtime validation in stores and API handlers

**Authentication:**
- Supabase Auth integration
- SecureStore for token persistence
- Auth state synced via `onAuthStateChange` listener
- Protected routes via `useProtectedRoute` hook

**Permissions:**
- CASL-based permissions (`src/features/auth/permissions/`)
- `AbilityProvider` provides permission context
- `useTripPermissions` hook for trip-specific checks

**Push Notifications:**
- expo-notifications for local/push notifications
- Push token registration with backend
- Notification store for state management

---

*Architecture analysis: 2026-01-10*
*Update when major patterns change*
