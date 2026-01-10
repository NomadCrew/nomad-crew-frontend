# Technology Stack

**Analysis Date:** 2026-01-10

## Languages

**Primary:**
- TypeScript 5.3 - All application code (`package.json`, `tsconfig.json`)
- Strict mode enabled with additional safety checks (`tsconfig.json`)

**Secondary:**
- JavaScript - Configuration files, build scripts (`app.config.js`, `babel.config.js`, `metro.config.js`)

## Runtime

**Environment:**
- Node.js - Development and build tooling
- React Native 0.76.7 - Mobile runtime (`package.json`)
- Expo SDK 52 - Development platform (`package.json`)
- New Architecture enabled (`app.config.js` - `newArchEnabled: true`)

**Package Manager:**
- npm with legacy-peer-deps (see `eas-build-pre-install` script)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 18.3.1 - UI framework (`package.json`)
- React Native 0.76.7 - Cross-platform mobile (`package.json`)
- Expo Router 4.0 - File-based navigation (`package.json`)
- React Navigation 7.0 - Native navigation primitives (`package.json`)

**Testing:**
- Jest 29.7 - Test runner (`package.json`)
- jest-expo 52.0 - Expo-specific Jest preset (`package.json`)
- React Native Testing Library 13.2 - Component testing (`package.json`)

**Build/Dev:**
- Expo CLI - Development server, builds (`expo start`)
- EAS Build - Cloud builds (`eas.json`)
- Metro - JavaScript bundler (Expo default)
- Babel with expo preset (`babel.config.js`)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.86 - Authentication & real-time (`src/api/supabase.ts`)
- `zustand` 5.0 - State management (`src/features/*/store.ts`)
- `@tanstack/react-query` 5.90 - Data fetching & caching (`src/lib/query-client.ts`)
- `react-native-paper` 5.12 - UI component library (`app/_layout.tsx`)
- `zod` 3.24 - Schema validation (`src/types/events.ts`)

**Authentication:**
- `@react-native-google-signin/google-signin` 13.2 - Google OAuth (`app.config.js`)
- `@invertase/react-native-apple-authentication` 2.4 - Apple Sign-In (`package.json`)
- `expo-auth-session` 6.0 - OAuth flows (`package.json`)
- `expo-secure-store` 14.0 - Secure token storage (`src/features/auth/store.ts`)

**Infrastructure:**
- `axios` 1.13 with `axios-retry` 4.5 - HTTP client (`src/api/api-client.ts`)
- `react-native-maps` 1.18 - Google Maps (`app.config.js`)
- `expo-location` 18.0 - Geolocation services (`package.json`)
- `expo-notifications` 0.29 - Push notifications (`src/features/notifications/`)
- `@shopify/flash-list` 2.2 - Performant lists (`package.json`)

**UI/Animation:**
- `react-native-reanimated` 3.16 - Animations (`package.json`)
- `moti` 0.29 - Declarative animations (`package.json`)
- `lottie-react-native` 7.1 - Lottie animations (`package.json`)
- `lucide-react-native` 0.469 - Icons (`package.json`)

## Configuration

**Environment:**
- Environment variables via `EXPO_PUBLIC_*` prefix
- `app.config.js` for dynamic Expo config
- `APP_VARIANT` determines dev/production builds
- Required env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GOOGLE_*`

**Build:**
- `tsconfig.json` - TypeScript with strict mode, path aliases (`@/*`)
- `babel.config.js` - Babel with expo preset
- `metro.config.js` - Metro bundler config
- `eas.json` - EAS Build profiles (development, preview, production)
- `.eslintrc.js` - ESLint with eslint-config-expo

## Platform Requirements

**Development:**
- macOS/Windows/Linux with Node.js
- Expo CLI (`npx expo`)
- iOS Simulator (macOS) or Android Emulator
- Physical device testing via Expo development client

**Production:**
- iOS 15.1+ deployment target (`app.config.js`)
- Android SDK 35 compile, SDK 34 target (`app.config.js`)
- Distributed via App Store and Google Play
- EAS Build for cloud builds

---

*Stack analysis: 2026-01-10*
*Update after major dependency changes*
