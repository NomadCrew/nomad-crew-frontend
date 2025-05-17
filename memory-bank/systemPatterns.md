# System Patterns & Architecture: NomadCrew Frontend

This document outlines the architectural patterns and design principles guiding the development of the NomadCrew frontend, especially following the comprehensive refactoring initiative.

## 1. Core Architectural Pattern: Feature-First (Modular)
The primary architectural pattern is **Feature-First**.
- **Rationale:** Improves cohesion, scalability, and developer onboarding. Makes it easier to manage and evolve features independently.
- **Structure:**
    ```
    src/
    ├── features/
    │   ├── [featureName]/  (e.g., chat, trips, auth)
    │   │   ├── index.ts            # Barrel file for public exports
    │   │   ├── components/         # UI components specific to this feature
    │   │   ├── screens/            # Screen components (if distinct from containers)
    │   │   ├── containers/         # Container components (logic-heavy)
    │   │   ├── store.ts            # Zustand store slice for this feature
    │   │   ├── service.ts          # API service for this feature
    │   │   ├── hooks/              # Custom hooks specific to this feature
    │   │   └── types.ts            # TypeScript types specific to this feature
    │   └── ...
    ├── components/                 # Globally reusable UI components (presentational)
    │   ├── ui/                     # Generic building blocks (Button, Text, Input)
    │   └── forms/                  # Reusable form elements/logic
    ├── navigation/                 # Expo Router configuration, layouts, navigators
    ├── hooks/                      # Globally reusable custom hooks
    ├── store/                      # Global Zustand store setup, root store, shared middleware
    ├── services/                   # Globally reusable services (e.g., apiClient, WebSocketManager)
    ├── theme/                      # Theming system (ThemeProvider, tokens, light/dark)
    ├── utils/                      # Generic utility functions
    └── types/                      # Global TypeScript types, enums
    ```
- **Expo Router Integration:** The `app/` directory for Expo Router will contain route entry files that typically import and render screens/containers from the `src/features/` modules. Route groups (`app/(tabs)/`, `app/(modals)/`) will be used for layout and navigation structure.

## 2. Design Principles: SOLID
All new and refactored code must strive to adhere to SOLID principles:
*   **Single Responsibility Principle (SRP):** Components, hooks, services, and store modules should have one primary responsibility. UI components focus on rendering, container components/hooks handle logic and state, services manage external communication.
*   **Open/Closed Principle (OCP):** Modules should be open for extension but closed for modification. Achieved through composition, props, and hooks.
*   **Liskov Substitution Principle (LSP):** Subtypes (e.g., different implementations of a chat message component) should be substitutable for their base types (props contracts).
*   **Interface Segregation Principle (ISP):** Components should not depend on props they don't use. Define minimal, focused prop interfaces.
*   **Dependency Inversion Principle (DIP):** High-level modules (features, stores) should depend on abstractions (interfaces, service contracts, hooks) rather than concrete low-level implementations. Services abstract API calls; stores are decoupled from direct API client usage.

## 3. Key Design Patterns
*   **Container/Presenter (Smart/Dumb Components):**
    *   **Container Components/Hooks:** Manage state, fetch data, handle side effects, and pass data/callbacks to presentational components. Often located in `features/[featureName]/containers/` or encapsulated within custom feature-specific hooks.
    *   **Presentational Components:** Focus solely on UI rendering based on props. Highly reusable. Located in `features/[featureName]/components/` or `src/components/` if globally reusable.
*   **Service Abstraction Layer:**
    *   All external API interactions (REST, Supabase direct calls) are encapsulated within service modules (e.g., `ChatService`, `TripService`, `AuthService`).
    *   Services are typically stateless modules exporting functions.
    *   Located in `features/[featureName]/service.ts` or `src/services/` for shared services (like `apiClient.ts`).
    *   Stores and containers use these services, promoting DIP and testability.
*   **Custom Hooks:**
    *   For reusable stateful logic, side effects, and abstracting complex component logic.
    *   Examples: `useFormValidation`, `useAppLifecycle`, `useChatSession(tripId)`, `useProtectedRoute`.
    *   Located in `features/[featureName]/hooks/` or `src/hooks/` for global hooks.
*   **State Management Pattern (Zustand):**
    *   Modular stores per feature (e.g., `useChatStore`, `useTripStore`).
    *   **Selectors:** Components subscribe to the smallest necessary slice of state using selectors (`useStore(state => state.specificValue)`) to minimize re-renders.
    *   **Actions:** Store actions handle state transitions. Side effects within actions delegate to services.
    *   **Middleware:** Use `persist` for AsyncStorage persistence, `devtools` for debugging.
    *   **Derived State:** Computed values are derived within selectors or stored if computationally expensive.
*   **Direct Imports (No Barrel Files for Application Code):**
    *   To optimize bundle size, improve tree-shaking, and enhance build/test performance, **barrel files (e.g., `index.ts` files that re-export multiple modules from a directory) MUST NOT be used for importing modules within the application code.**
    *   Always prefer direct imports from the specific file where a module is defined (e.g., `import { MyComponent } from '@/src/features/chat/components/MyComponent';` instead of `import { MyComponent } from '@/src/features/chat';`).
    *   This rule is based on observed negative impacts on final bundle sizes and test execution times.
    *   Note: This rule applies to internal application imports. External library entry points (which often act as barrel files) are consumed as designed by the library authors.

## 4. Navigation Pattern (Expo Router)
*   File-based routing via `app/` directory.
*   Layouts (`_layout.tsx`) define navigation structure (Stacks, Tabs) and wrap routes with global providers (Theme, Auth, SafeArea).
*   Route groups for organizing sections (e.g., `(auth)`, `(tabs)`).
*   Dynamic routes for parameterized screens (e.g., `app/chat/[tripId].tsx`).
*   Programmatic navigation via `expo-router`'s `router` object.
*   Deep linking configured via `app.config.js` and handled by Expo Router.
*   Guarded routes implemented using layouts or higher-order components/hooks checking auth state.

## 5. Error Handling Strategy
*   **API Errors:** `apiClient` (Axios instance) uses interceptors to handle common HTTP errors (e.g., 401 for logout, 403 for forbidden). Standardized error shapes from API responses.
*   **Component Errors:** React Error Boundaries at strategic points (e.g., around major feature areas or in root layout) to catch rendering errors and display fallbacks.
*   **State Errors:** Stores may include an `error` field to communicate issues (e.g., failed data fetch) to the UI.
*   **Logging:** Consistent use of a logger utility, with levels for dev/prod. Integration with a remote error reporting service (e.g., Sentry) is planned.

## 6. Asynchronous Operations
*   Managed primarily through Zustand store actions and services.
*   Promises (`async/await`) for handling asynchronous flows.
*   Loading states (`isLoading`, `isSubmitting`) maintained in stores and used by UI to provide feedback.
*   Real-time updates via WebSockets, managed by a `WebSocketManager` (or feature-specific socket services) and integrated with Zustand stores. 