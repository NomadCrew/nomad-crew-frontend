# Tech Context: NomadCrew Frontend

This document outlines the technology stack, key libraries, and development practices for the NomadCrew frontend.

## 1. Core Framework & Platform
*   **React Native:** Cross-platform mobile application development.
*   **Expo (Managed Workflow):** Simplifies development, building, and deployment of React Native apps. Includes Expo Go for development, EAS Build for cloud builds, and EAS Submit for store submissions.
    *   **Expo Router:** File-system based routing for navigation.
    *   **Expo Dev Client:** Used for including native modules during development if needed, though managed workflow is preferred.

## 2. Language
*   **TypeScript (Strict Mode):** For type safety, improved developer experience, and maintainability. All new code is written in TypeScript.
    *   `tsconfig.json` configured for strict checks.
    *   Goal: Full type coverage, no `any` (unless absolutely unavoidable and documented).

## 3. State Management
*   **Zustand:** Lightweight, flexible state management library.
    *   **Store Structure:** Modular stores per feature (e.g., `useAuthStore`, `useTripStore`).
    *   **Selectors:** Heavily used for performance (components subscribe only to necessary state slices).
    *   **Actions & Immutability:** State updates are immutable (typically via `set(state => ({ ... }))`).
    *   **Middleware:**
        *   `persist` (with AsyncStorage) for persisting state across sessions.
        *   `devtools` for Redux DevTools integration during development.
        *   `immer` (optional, if complex immutable updates are needed).

## 4. UI & Styling
*   **React Native Paper:** Material Design component library for UI elements.
*   **Custom Theme System:**
    *   Light and Dark mode support.
    *   Semantic color tokens and typography scales.
    *   Implemented via React Context (`ThemeProvider`) and custom theme objects.
*   **Styling:** StyleSheet API, Flexbox for layout. Responsive design using `useWindowDimensions` and conditional styling.
*   **Animations:**
    *   `react-native-reanimated` for performant animations.
    *   `react-native-gesture-handler` for gesture interactions.
*   **Visual Enhancements:**
    *   `expo-blur` for blur effects.
    *   `expo-linear-gradient` for gradients.
    *   `lottie-react-native` for Lottie animations.

## 5. Navigation
*   **Expo Router:** Primary navigation library.
    *   File-based routing (`app/` directory).
    *   Stack, Tabs, and Modal navigators via layout files.
    *   Deep linking support via `scheme` in `app.config.js`.
    *   `useLocalSearchParams`, `useGlobalSearchParams` for accessing route params.
    *   `router.push`, `router.replace`, `router.back` for programmatic navigation.

## 6. Authentication & Authorization
*   **Supabase:** Backend-as-a-Service for authentication.
    *   Email/Password, Google, Apple social logins.
    *   Supabase client library (`@supabase/supabase-js`).
*   **Token Management:**
    *   JWT tokens stored securely using `expo-secure-store`.
    *   Token decoding with `jwt-decode`.
    *   Auth state managed in `useAuthStore`.
*   **Protected Routes:** Implemented using Expo Router layouts or custom hooks (`useProtectedRoute`).

## 7. Data Fetching & API Communication
*   **Axios:** HTTP client for REST API calls to the custom backend.
    *   Centralized `apiClient` instance with interceptors for request/response manipulation (e.g., adding auth tokens, error handling).
*   **Real-time Communication:**
    *   WebSockets for features like chat and live updates.
    *   Custom `WebSocketManager` or feature-specific WebSocket services.
    *   Server-Sent Events (SSE) if applicable for one-way real-time updates.
*   **Data Caching:**
    *   AsyncStorage for simple data persistence (via Zustand `persist` or manual).
    *   Strategies for offline support and optimistic updates.

## 8. Forms
*   React Native core components (`TextInput`, etc.).
*   Custom form hooks (e.g., `useFormValidation`) for managing form state, validation, and submission logic.
*   Consideration for form libraries like `react-hook-form` if forms become very complex.

## 9. List Rendering
*   **@shopify/flash-list:** High-performance list component for large datasets (e.g., chat messages, notifications). To be used over `FlatList` where appropriate.
*   Pagination, windowing, and item memoization (`React.memo`) for optimizing list performance.

## 10. Linting & Formatting
*   **ESLint:** With Expo's recommended configuration (`eslint-config-expo`) and custom rules.
    *   `typescript-eslint` for TypeScript-specific rules.
    *   Plugins for React, React Hooks, accessibility, etc.
*   **Prettier:** Automated code formatting integrated with ESLint (`eslint-config-prettier`, `eslint-plugin-prettier`).
*   Enforced via Git hooks (Husky) and CI pipeline.

## 11. Testing
*   **Jest:** Test runner.
*   **React Native Testing Library (RNTL):** For component testing (rendering, interactions).
    *   Custom `render` utility wrapping components with necessary providers.
*   **Zustand Store Testing:** Direct testing of store actions and selectors, mocking services/APIs.
*   **Mock Service Worker (MSW) / Jest Mocks:** For mocking API calls in integration tests.
*   **Detox:** For End-to-End (E2E) testing on simulators/emulators.
*   **Test Coverage:** Monitored via Jest's coverage reporting.

## 12. Build & Deployment
*   **EAS Build (Expo Application Services):** Cloud builds for iOS and Android.
*   **EAS Submit:** Submitting builds to app stores.
*   **CircleCI:** Continuous Integration for running linters, tests, and triggering builds.
*   **Environment Variables:** Managed via `.env` files (e.g., `.env.development`, `.env.production`) and Expo's `extra` field in `app.config.js`. `expo-env` for type-safe environment variable access.

## 13. Version Control
*   **Git & GitHub:** For source code management and collaboration.

## 14. Documentation
*   **JSDoc/TSDoc:** For inline code documentation of functions, components, and hooks.
*   **Markdown files (`.md`):** For project overview, context, patterns, and progress tracking (in `./memory-bank/`).
*   **README.md:** High-level project information, setup instructions, and script commands. 