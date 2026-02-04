# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Response Protocol

Before executing ANY non-trivial task, first compile the request into a structured specification:

### Step 1: Classify Intent
Identify the primary intent: `research` | `decision` | `design` | `code` | `writing` | `ops`

### Step 2: State the Objective
Write a single clear sentence describing what success looks like.

### Step 3: Document Assumptions
List any defaults being applied due to missing information. Format:
- **Assumption:** [What you're assuming]
- **Reason:** [Why this is a reasonable default]

### Step 4: Define Verification Criteria
List pass/fail criteria that will confirm the task is complete.

### Step 5: Execute
Only after completing steps 1-4, proceed with the work.

### When to Skip This Protocol
- Simple questions with obvious answers
- Single-file edits with clear instructions
- Commands the user explicitly specifies

### Example

**User:** "Add dark mode"

**Compiled:**
- **Intent:** code
- **Objective:** Implement theme switching between light and dark modes
- **Assumptions:**
  - System preference detection desired (modern UX standard)
  - Toggle placement in header (common pattern, not specified)
  - Persist preference in localStorage (standard approach)
- **Verification:**
  - [ ] Toggle switches between light/dark
  - [ ] Preference persists across sessions
  - [ ] Respects system preference on first visit

**Then execute.**

---

## Development Commands

### Core Development
```bash
# Start development server with cache clear
npm start

# Run on specific platforms
npm run android
npm run ios
npm run web

# Run linting
npm run lint

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Run type checking (TypeScript)
npx tsc --noEmit
```

### Building and Deployment
```bash
# EAS Build commands
eas build --platform ios --profile development
eas build --platform android --profile development
eas build --platform all --profile preview
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

## High-Level Architecture

### Frontend Stack
- **Framework**: React Native with Expo SDK 52
- **Language**: TypeScript with strict mode
- **Navigation**: Expo Router (file-based routing) + React Navigation
- **State Management**: Zustand stores (auth, trips, chat, todos, location, notifications)
- **UI Framework**: React Native Paper + custom theme system
- **Real-time**: Supabase Realtime for WebSocket connections
- **Authentication**: Supabase Auth with Google/Apple OAuth

### Project Structure
```
src/
├── api/              # API clients and backend communication
├── features/         # Feature-based modules (auth, chat, trips, etc.)
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       ├── screens/
│       ├── store.ts
│       └── types.ts
├── theme/           # Custom theme system with light/dark modes
├── hooks/           # Global React hooks
├── types/           # Global TypeScript types
└── utils/           # Helper functions and utilities

app/                 # Expo Router screens and layouts
├── (auth)/         # Authentication flow screens
├── (tabs)/         # Main tab navigation
├── (onboarding)/   # Onboarding screens
└── _layout.tsx     # Root layout with providers
```

### Key Architectural Patterns

1. **Feature-Based Organization**: Each major feature (auth, chat, trips, etc.) is self-contained with its own components, hooks, store, and types.

2. **Zustand State Management**: 
   - Each feature has its own Zustand store
   - Stores handle async operations, persistence, and WebSocket updates
   - Example: `useAuthStore`, `useTripStore`, `useChatStore`

3. **Theme System**:
   - Custom theme implementation with React Native Paper integration
   - Supports light/dark modes with semantic color tokens
   - Theme utilities for consistent styling across components
   - Located in `src/theme/` with foundations (colors, typography, spacing)

4. **Real-time Updates**:
   - Supabase Realtime channels for live data synchronization
   - Event-based architecture for handling WebSocket messages
   - Automatic reconnection and error handling

5. **Authentication Flow**:
   - Supabase Auth integration with secure token storage
   - Support for email/password and social logins (Google, Apple)
   - Protected routes with automatic redirection
   - Onboarding flow for new users

6. **API Communication**:
   - Centralized API client with automatic token injection
   - Error handling and retry logic
   - Type-safe API calls with TypeScript

### Environment Configuration
- **Development**: Uses `.dev` bundle identifiers and development API endpoints
- **Production**: Uses production bundle identifiers and live APIs
- Environment variables prefixed with `EXPO_PUBLIC_` for client-side access

### Testing Strategy
- Jest with React Native Testing Library
- Custom test utilities for theme and provider mocks
- Component and integration testing focus
- Mock implementations for native modules

### Critical Dependencies
- **Supabase**: Authentication and real-time data (`https://efmqiltdajvqenndmylz.supabase.co`)
- **Google Maps**: Location services (separate API keys for iOS/Android)
- **Expo Modules**: Location, notifications, secure storage, etc.

### Code Principles
- Functional components with hooks (no class components)
- TypeScript interfaces over types (avoid enums, use const maps)
- Modular, reusable components
- Declarative JSX patterns
- Naming: directories use kebab-case, components use PascalCase, hooks use camelCase with 'use' prefix

### Performance Considerations
- Use `@shopify/flash-list` for large lists
- Implement memoization where appropriate
- Lazy loading with React Suspense
- Image optimization and caching strategies

### Security Practices
- Secure token storage with Expo SecureStore
- Input sanitization for user-generated content
- API key restrictions and proper scoping
- No hardcoded credentials or sensitive data

## Design Patterns

### Provider Pattern
The app uses React Context providers for cross-cutting concerns:
- **AuthProvider**: Manages authentication state and deep linking (`src/features/auth/components/AuthProvider.tsx`)
- **OnboardingProvider**: Tracks first-time user state (`src/providers/OnboardingProvider.tsx`)
- **ThemeProvider**: Provides theme context throughout the app
- **NotificationProvider**: Handles in-app notification display

### Guard Pattern
Route protection and conditional rendering:
- **AuthGuard**: Protects routes requiring authentication, handles token refresh (`src/features/auth/components/AuthGuard.tsx`)
- **OnboardingGate**: Controls access based on onboarding completion (`src/components/common/OnboardingGate.tsx`)
- Priority-based gating: Username requirement > First-time user > Authentication

### Store Pattern (Zustand)
Each feature has a dedicated Zustand store with standardized patterns:
- Async operations with loading/error states
- Event handlers for real-time updates
- Persistence with AsyncStorage
- Example structure: `{ state, actions, eventHandlers }`

### Adapter Pattern
Data normalization between backend and frontend:
- **normalizeTrip**: Transforms backend trip data to frontend format (`src/features/trips/adapters/normalizeTrip.ts`)
- Ensures consistent data structure across the app
- Handles missing or malformed data gracefully

### Hook Composition Pattern
Custom hooks that compose multiple concerns:
- **useResponsiveLayout**: Combines window dimensions with theme breakpoints
- **useThemedStyles**: Merges theme-aware styles with component props
- **useProtectedRoute**: Combines auth state with navigation

### Theme Factory Pattern
Style creation utilities for consistent theming:
- **createStyles**: Factory function for creating memoized, theme-aware styles
- Returns StyleSheet objects optimized for React Native
- Example: `const useStyles = createStyles((theme) => ({ ... }))`

## Development Workflow

### Expo Development Client
The app uses Expo's development client for a native development experience:
```bash
# Build development client
eas build --platform ios --profile development
eas build --platform android --profile development

# Start dev server for development builds
npm start
```

### Physical Device Testing
Always test on physical devices for accurate performance and behavior:
- Development builds are configured for internal distribution
- Use QR codes or direct installation for testing
- Supports hot reload and debugging tools
- Environment-specific builds with `.dev` bundle identifiers

### EAS Build Configuration
Build profiles in `eas.json`:
- **development**: Debug builds with development client
- **preview**: Internal testing builds
- **production**: App store builds with auto-increment versioning

### Environment Management
- Development uses `APP_VARIANT=development`
- Production uses `APP_VARIANT=production`
- Google OAuth configured with environment-specific client IDs
- Separate bundle identifiers per environment

## Additional Architectural Patterns

### Event-Driven Architecture
Real-time updates through Supabase channels:
- Feature stores subscribe to relevant events
- Event handlers update local state
- Automatic reconnection on network changes
- Example: `handleTripEvent`, `handleChatMessage`

### Responsive Design Patterns
- **useWindowDimensions**: React Native's built-in hook for responsive layouts
- **Breakpoints**: Defined in theme for tablet/desktop layouts
- **Grid system**: Dynamic columns based on screen size
- **Container constraints**: Max width for large screens

### Error Boundary Patterns
- Feature-specific error boundaries (e.g., `TodoErrorBoundary`)
- Graceful fallbacks for component failures
- Error logging to external services
- User-friendly error messages

### Lazy Loading Patterns
- Route-based code splitting with Expo Router
- Dynamic imports for heavy components
- Suspense boundaries for loading states
- Prefetching for anticipated navigation