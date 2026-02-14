# CLAUDE.md — NomadCrew Frontend

Parent context: `../CLAUDE.md` (project-wide rules, cross-repo integration, agent patterns)

## Quick Reference — Commands

```bash
npm start                    # Dev server (expo start -c)
npm run android / ios / web  # Platform-specific
npm run lint                 # ESLint
npm run format               # Prettier write
npm test                     # Jest
npm run test:watch           # Jest watch mode
npm run test:coverage        # Jest with coverage
npm run test:e2e             # Maestro E2E tests
npx tsc --noEmit             # Type checking
```

**EAS Builds:** `eas build --platform <ios|android|all> --profile <development|preview|production>`
**Store Submit:** `eas submit --platform <ios|android> --profile production`

## Stack

React Native + Expo SDK 52 · TypeScript (strict) · Expo Router · Zustand (7 stores) · TanStack React Query · React Native Paper + NativeWind · Supabase Auth + Realtime · Custom WebSocket (Go backend) · CASL permissions · Zod validation · axios + axios-retry

## Project Structure

```
src/
├── api/              # ApiClient (axios singleton), AuthApi, BaseApiClient, env config
├── components/       # Shared UI: atoms/ molecules/ organisms/ templates/ common/ ui/
├── constants/        # Onboarding content
├── events/           # eventBus.ts — cross-feature event communication
├── features/         # Feature modules (see below)
├── hooks/            # Global hooks (useAuth, useProtectedRoute, useNetworkStatus, etc.)
├── lib/              # query-client.ts (TanStack React Query + AsyncStorage persister)
├── providers/        # OnboardingProvider
├── theme/            # ThemeProvider, createStyles, Paper adapter, light/dark tokens
├── types/            # Global types: ApiError, ServerEvent, event type guards, declarations
└── utils/            # api-paths.ts, store-reset.ts, logger.ts, weather.ts, token.ts

app/                  # Expo Router
├── _layout.tsx       # Root layout (provider hierarchy below)
├── AppInitializer.tsx # Startup: fonts, auth init, notifications, splash
├── (auth)/           # login, register, email, verify-email, invitation
├── (onboarding)/     # welcome, username, contact-email, permissions
├── (tabs)/           # trips, notifications, wallet, profile
├── trip/[id].tsx     # Trip detail
├── chat/[tripId].tsx # Trip chat
├── invite/[id].tsx   # Invitation + accept/[token].tsx
└── location/[id].tsx # Live location map
```

### Feature Modules (`src/features/`)

| Feature           | Store                  | Key files                                                                                                  |
| ----------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| **auth**          | `useAuthStore`         | `service.ts` (Supabase client), `secure-storage.ts` (SecureStore adapter), `permissions/ability.ts` (CASL) |
| **trips**         | `useTripStore`         | `adapters/normalizeTrip.ts`, `queries.ts` (React Query), `hooks.ts`                                        |
| **chat**          | `useChatStore`         | `service.ts`, offline message queue, read receipts                                                         |
| **todos**         | `useTodoStore`         | `queries.ts` (React Query), `api.ts`                                                                       |
| **wallet**        | `useWalletStore`       | `adapters/normalizeDocument.ts`, Supabase Realtime subscriptions                                           |
| **location**      | `useLocationStore`     | `store/useLocationStore.ts`, `components/GroupLiveMap.tsx`                                                 |
| **notifications** | `useNotificationStore` | `store/useNotificationStore.ts`, `services/pushNotificationService.ts`                                     |
| **websocket**     | —                      | `WebSocketManager.ts` (singleton), `WebSocketConnection.ts`                                                |
| **users**         | —                      | `api.ts` (search, autocomplete)                                                                            |

## Architecture

### Provider Hierarchy (root layout)

```
PersistQueryClientProvider → GestureHandlerRootView → ThemeProvider → OnboardingProvider
  → AbilityProvider (CASL) → PaperProvider → AuthErrorBoundary → AppInitializer → Slot
```

### API Layer

- **`BaseApiClient`** → axios + retry (3x exponential) → error interceptors
- **`ApiClient`** extends Base → singleton → auth token injection, preemptive refresh, 401 queue
- **`AuthApi`** extends Base → singleton → separate client to avoid circular deps
- **All endpoints** defined in `src/utils/api-paths.ts` via `createApiPath()` (prefixes `/v1/`)
- **Backend URLs:** dev = `EXPO_PUBLIC_DEV_API_URL` or `localhost:8080`, prod = `https://api.nomadcrew.uk`

### Dual Real-Time Architecture

1. **Custom WebSocket** (`src/features/websocket/WebSocketManager.ts`): Connects to Go backend (`ws://[base]/v1/ws`). Routes events to location, chat, and notification stores. Reconnects with exponential backoff.
2. **Supabase Realtime**: Used by wallet store (`postgres_changes` on `wallet_documents`) and notification service. Also handles `onAuthStateChange` session events.

### Auth Flow

Supabase Auth → tokens in expo-secure-store (chunked for 2048-byte limit) → `AuthGuard` protects routes → `OnboardingGate` checks username/contact-email → `registerAuthHandlers()` connects auth store to API client for token refresh

### State Management Split

- **Zustand** — client state, complex async flows (auth, chat, location, wallet)
- **TanStack React Query** — server-state caching (trips queries, todos queries), persisted to AsyncStorage
- **Store reset** — `registerStoreReset()` per store, `resetAllStores()` on logout (`src/utils/store-reset.ts`)

### Store Conventions

- Per-operation loading flags: `isCreating`, `isFetching`, `isUpdating`, `isDeleting` (not single `loading`)
- Granular selectors: `selectIsCreating`, `selectIsFetching`, etc.
- Event handlers for real-time: `handleTripEvent`, `handleDocumentEvent`, etc.
- Type guards from `src/types/events.ts`: `isTripEvent`, `isWeatherEvent`, `isMemberEvent`, `isChatEvent`

## Critical Warnings

- **EAS Secrets**: Never reference EAS secrets in `eas.json` `env` field — they auto-load into builds. Putting `@SECRET_NAME` in env overrides with the literal string. See `docs/EAS_SECRETS_GUIDE.md`.
- **Component naming**: Use `AppButton`, `AppCard` (not `Button`, `Card`) to avoid React Native Paper conflicts.
- **Supabase URL**: `efmqiltdajvqenndmylz.supabase.co` (configured in `app.config.js`)
- **Secure storage**: Auth tokens use `secureStorage` adapter (expo-secure-store with chunking), NOT AsyncStorage. See `src/features/auth/secure-storage.ts`.
- **API paths**: All endpoints MUST go through `src/utils/api-paths.ts`. Don't hardcode paths.
- **`nul` file**: Windows artifact — gitignore it, don't commit.

## Code Conventions

- Functional components + hooks only (no class components)
- TypeScript interfaces over types; avoid enums, use const maps
- Directories: kebab-case · Components: PascalCase · Hooks: `use` prefix, camelCase
- Components follow atomic design: `src/components/atoms/`, `molecules/`, `organisms/`, `templates/`
- Path alias: `@/` maps to project root (e.g., `@/src/features/auth/store`)

## Testing

- **Unit/Integration**: Jest + React Native Testing Library (`npm test`)
- **E2E**: Maestro (`.maestro/flows/` — auth, chat, trips, smoke-test)
- **Test utils**: `__tests__/test-utils.tsx` (custom render with providers)
- **Factories**: `__tests__/factories/` (user, trip, invitation)
- **Mocks**: `__tests__/mocks/` (API responses, Supabase)
- **Pre-commit**: husky + lint-staged

## Environment

- `APP_VARIANT=development` → `.dev` bundle IDs, dev API
- `APP_VARIANT=production` → production bundle IDs, live API
- Client-accessible env vars use `EXPO_PUBLIC_*` prefix
- Google OAuth: separate client IDs per platform/environment
- Config: `app.config.js` (dynamic), `eas.json` (build profiles: dev/preview/production)

## Specialized Documentation Index

### Setup & Operations

| Doc                                | When to consult                                                       |
| ---------------------------------- | --------------------------------------------------------------------- |
| `docs/DEVELOPMENT_SETUP.md`        | Setting up dev environment, env vars, device testing, common errors   |
| `docs/EAS_SECRETS_GUIDE.md`        | EAS build secrets, file-based secrets, `EXPO_PUBLIC_*` prefix rules   |
| `docs/GOOGLE_API_KEYS.md`          | Google Maps/Places/OAuth key inventory, native SDK vs HTTP fetch keys |
| `docs/PUSH_NOTIFICATIONS_SETUP.md` | APNs keys, FCM config, Expo Push API flow, troubleshooting            |
| `docs/WSL_REACT_NATIVE_SETUP.md`   | WSL2-specific dev setup                                               |

### Architecture & Integration

| Doc                                 | When to consult                                                            |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `docs/BACKEND_INTEGRATION_GUIDE.md` | Dual-database arch: NeonDB (primary via Go API) + Supabase (auth/realtime) |
| `docs/CHAT.md`                      | Chat hooks, Realtime tables, message types, API endpoints                  |
| `docs/ATOMIC_DESIGN_MIGRATION.md`   | Component migration status, import path conventions                        |
| `docs/code-quality-audit.md`        | Known tech debt, priority fixes, pattern recommendations                   |

### Store Submission

| Doc                           | When to consult                   |
| ----------------------------- | --------------------------------- |
| `store/RELEASE_CHECKLIST.md`  | Play Store release steps          |
| `store/PLAY_STORE_LISTING.md` | Store listing content             |
| `store/SCREENSHOT_GUIDE.md`   | Screenshot capture and processing |

### Feature Planning

| Doc                    | When to consult                 |
| ---------------------- | ------------------------------- |
| `.planning/PROJECT.md` | Wallet feature project overview |
| `.planning/ROADMAP.md` | Wallet feature phase breakdown  |
