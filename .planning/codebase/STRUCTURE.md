# Codebase Structure

**Analysis Date:** 2026-01-10

## Directory Layout

```
nomad-crew-frontend/
├── app/                    # Expo Router screens and layouts
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   ├── (onboarding)/      # Onboarding flow
│   ├── chat/              # Chat screens
│   ├── debug/             # Debug screens
│   ├── invite/            # Invitation handling
│   ├── location/          # Location screens
│   ├── trip/              # Trip detail screens
│   ├── _layout.tsx        # Root layout with providers
│   └── AppInitializer.tsx # App initialization logic
├── src/                    # Source code
│   ├── api/               # API clients and utilities
│   ├── auth/              # Legacy auth (being migrated)
│   ├── components/        # Reusable components
│   ├── events/            # Event bus utilities
│   ├── features/          # Feature modules
│   ├── hooks/             # Global hooks
│   ├── lib/               # Library configurations
│   ├── navigation/        # Navigation utilities
│   ├── providers/         # Context providers
│   ├── services/          # Shared services
│   ├── store/             # Legacy stores (migrating to features)
│   ├── theme/             # Theme system
│   ├── types/             # Global type definitions
│   └── utils/             # Utility functions
├── components/             # Legacy components location
│   ├── common/            # Common components
│   ├── onboarding/        # Onboarding components
│   ├── shared/            # Shared components
│   ├── ui/                # UI components
│   └── __tests__/         # Component tests
├── __tests__/              # Test files
│   ├── api/               # API tests
│   ├── store/             # Store tests
│   ├── hooks/             # Hook tests
│   └── permissions/       # Permission tests
├── assets/                 # Static assets
│   ├── animations/        # Lottie animations
│   ├── fonts/             # Custom fonts
│   └── images/            # Images and icons
├── android/                # Android native code
├── ios/                    # iOS native code
├── scripts/                # Build and utility scripts
├── .maestro/               # E2E test flows
└── docs/                   # Documentation
```

## Directory Purposes

**app/**
- Purpose: Expo Router file-based routing
- Contains: Screen components, layouts, route groups
- Key files: `_layout.tsx` (root), `(tabs)/_layout.tsx` (tab nav)
- Subdirectories: Route groups `(auth)`, `(tabs)`, `(onboarding)`

**src/features/**
- Purpose: Feature-modular code organization
- Contains: Self-contained feature modules
- Key files: Each feature has `store.ts`, `types.ts`, `hooks.ts`
- Subdirectories:
  - `auth/` - Authentication, permissions
  - `trips/` - Trip management
  - `chat/` - Chat functionality
  - `todos/` - Todo lists
  - `location/` - Location sharing
  - `notifications/` - Push notifications
  - `websocket/` - WebSocket connection management

**src/api/**
- Purpose: Backend communication layer
- Contains: API clients, error handling, Supabase setup
- Key files:
  - `api-client.ts` - Axios instance with interceptors
  - `supabase.ts` - Supabase client singleton
  - `auth-api.ts` - Auth-specific API calls
  - `errors.ts` - Error type definitions
  - `constants.ts` - API constants and error codes

**src/components/**
- Purpose: Shared UI components (atomic design)
- Contains: Atoms, molecules, organisms
- Key files: `index.ts` barrel exports
- Subdirectories:
  - `atoms/` - Basic building blocks (Badge, Button, Card)
  - `molecules/` - Composed components (BentoGrid)
  - `organisms/` - Complex components
  - `notifications/` - Notification-specific components

**src/theme/**
- Purpose: Theming system
- Contains: Theme definitions, utilities, Paper adapter
- Key files:
  - `ThemeProvider.tsx` - Theme context provider
  - `paper-adapter.ts` - React Native Paper theme adapter
  - `create-theme.ts` - Theme factory
- Subdirectories:
  - `foundations/` - Colors, typography, spacing, animations
  - `utils/` - Style utilities, hooks

**src/hooks/**
- Purpose: Global reusable hooks
- Contains: Authentication, network, lifecycle hooks
- Key files:
  - `useAuth.ts` - Auth state access
  - `useProtectedRoute.ts` - Route protection
  - `useGoogleSignIn.ts` - Google OAuth
  - `useAppleSignIn.ts` - Apple OAuth
  - `useNetworkStatus.ts` - Network monitoring

**src/types/**
- Purpose: Global TypeScript definitions
- Contains: Type definitions, Zod schemas
- Key files:
  - `events.ts` - Server event types with Zod validation
  - `places.ts` - Place/location types
  - `onboarding.ts` - Onboarding types

**__tests__/**
- Purpose: Test files (separate from source)
- Contains: Unit and integration tests
- Key files: `*.test.ts`, `*.test.tsx`
- Subdirectories:
  - `store/` - Zustand store tests
  - `api/` - API client tests
  - `hooks/` - Hook tests
  - `factories/` - Test data factories
  - `mocks/` - Mock implementations

## Key File Locations

**Entry Points:**
- `app/_layout.tsx` - Root layout, provider setup
- `app/AppInitializer.tsx` - Font loading, auth init, splash

**Configuration:**
- `app.config.js` - Expo configuration
- `tsconfig.json` - TypeScript config
- `package.json` - Dependencies, scripts
- `eas.json` - EAS Build profiles
- `.eslintrc.js` - ESLint rules
- `jest.setup.js` - Jest configuration

**Core Logic:**
- `src/features/auth/store.ts` - Auth state management
- `src/features/trips/store.ts` - Trip state management
- `src/api/api-client.ts` - HTTP client
- `src/api/supabase.ts` - Supabase client
- `src/lib/query-client.ts` - React Query setup

**Testing:**
- `__tests__/store/*.test.ts` - Store tests
- `__tests__/api/*.test.ts` - API tests
- `jest.setup.js` - Test setup, mocks

## Naming Conventions

**Files:**
- `kebab-case.ts` - Utility files, API files
- `PascalCase.tsx` - React components
- `camelCase.ts` - Hooks (prefixed with `use`)
- `*.test.ts` - Test files
- `index.ts` - Barrel exports

**Directories:**
- `kebab-case/` - Feature directories, utilities
- Route groups: `(groupName)/` for Expo Router

**Special Patterns:**
- `_layout.tsx` - Expo Router layout files
- `store.ts` - Zustand store per feature
- `types.ts` - Type definitions per feature
- `hooks.ts` - Feature-specific hooks
- `service.ts` - Feature services

## Where to Add New Code

**New Feature:**
- Primary code: `src/features/{feature-name}/`
- Store: `src/features/{feature-name}/store.ts`
- Types: `src/features/{feature-name}/types.ts`
- Components: `src/features/{feature-name}/components/`
- Tests: `__tests__/store/{feature-name}.test.ts`

**New Screen:**
- Screen: `app/{route-path}/index.tsx` or `app/{route-path}.tsx`
- Layout: `app/{route-path}/_layout.tsx` for nested routes
- Protected routes: Use `(auth)` group or `useProtectedRoute`

**New Component:**
- Atoms: `src/components/atoms/{ComponentName}/`
- Molecules: `src/components/molecules/{ComponentName}/`
- Feature-specific: `src/features/{feature}/components/`

**New Hook:**
- Global: `src/hooks/use{HookName}.ts`
- Feature-specific: `src/features/{feature}/hooks/`

**New API Endpoint:**
- API call: `src/api/api-client.ts` or feature service
- API path: `src/utils/api-paths.ts`
- Types: `src/features/{feature}/types.ts`

## Special Directories

**node_modules/**
- Purpose: npm dependencies
- Source: Auto-generated by npm install
- Committed: No (.gitignore)

**android/, ios/**
- Purpose: Native platform code
- Source: Generated by Expo, customized for native modules
- Committed: Yes (required for native builds)

**coverage/**
- Purpose: Test coverage reports
- Source: Generated by `npm test:coverage`
- Committed: No (.gitignore)

**.expo/**
- Purpose: Expo generated files
- Source: Auto-generated by Expo CLI
- Committed: Partially (types included)

**.planning/**
- Purpose: Project planning documents
- Source: GSD workflow outputs
- Committed: Yes

---

*Structure analysis: 2026-01-10*
*Update when directory structure changes*
