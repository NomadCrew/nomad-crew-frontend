# Product Context: NomadCrew Frontend

## 1. Product Overview
The NomadCrew Frontend is a React Native mobile application built with Expo, designed to be the primary interface for users of the NomadCrew group travel platform. It facilitates trip planning, communication, and management for various types of group travel.

## 2. Key Features (Current & Planned)
The application aims to provide a comprehensive suite of tools for group travelers:

*   **Authentication:**
    *   Secure user login/registration via email/password and social providers (Google, Apple) using Supabase.
    *   Session management with secure token storage.
*   **Trip Management:**
    *   Create new trips with details (name, dates, destination, cover image).
    *   View list of user's trips (upcoming, past).
    *   Trip dashboards with overview information.
    *   Invite members to trips.
    *   Manage trip roles and permissions.
*   **Real-time Chat:**
    *   Dedicated chat rooms for each trip.
    *   Send/receive text messages.
    *   Typing indicators.
    *   Read receipts.
    *   Multimedia messaging (images, planned).
    *   Message persistence.
*   **Shared To-Do Lists:**
    *   Create and manage shared task lists per trip.
    *   Assign tasks (planned).
    *   Track task completion.
    *   Real-time updates on to-do list changes.
*   **Notifications:**
    *   In-app notifications for important events (new messages, task updates, invites).
    *   Push notifications (requires setup with Expo Push Notifications).
    *   Notification settings and preferences.
*   **Location Features (Optional per trip):**
    *   Share location with trip members.
    *   View map of trip members' locations (planned).
*   **User Profile & Settings:**
    *   Manage user profile information.
    *   App settings (theme, notification preferences).
*   **Onboarding:**
    *   Guided tour for new users to explain key features.

## 3. Current Development Stage & Focus
The application is currently in a significant **refactoring and modernization phase**. Based on an expert consultant's review, the immediate focus is on:
*   **Restructuring the codebase** to a feature-first architecture for improved modularity and scalability.
*   **Enhancing code quality** by applying SOLID principles, standard design patterns, and consistent coding standards.
*   **Optimizing state management** (Zustand) for better performance and maintainability.
*   **Improving navigation** using Expo Router with robust deep linking.
*   **Boosting performance** through list virtualization, lazy loading, and asset optimization.
*   **Establishing a comprehensive testing strategy** (unit, component, integration, E2E).

This refactor aims to build a solid foundation for future feature development and ensure the application is production-ready, maintainable, and scalable.

## 4. User Stories (Examples related to refactor impact)
*   **As a developer,** I want the codebase to be clearly organized by feature so I can quickly locate and modify relevant code for a specific feature like "Chat" or "Trips."
*   **As a developer,** I want components and hooks to have single responsibilities so they are easier to understand, test, and reuse.
*   **As a developer,** I want a consistent way to handle API calls and state updates so that adding new data interactions is straightforward and less error-prone.
*   **As a user,** I want the app to load quickly and respond smoothly, especially when viewing long lists of messages or trips.
*   **As a product owner,** I want the app to be easily extendable with new features without introducing regressions, thanks to a robust and well-tested codebase.

## 5. Production Readiness Checklist (High-Level - To be detailed in `progress.md`)
Refers to goals post-refactor:
*   [ ] Core features (Auth, Trips, Chat, Todos, Notifications) are stable and well-tested.
*   [ ] Codebase adheres to the new feature-first architecture and SOLID principles.
*   [ ] State management is optimized and uses selectors effectively.
*   [ ] Navigation is seamless, and deep linking works reliably.
*   [ ] Performance meets targets for load time and responsiveness.
*   [ ] Comprehensive test suite (unit, component, integration, E2E) is in place with good coverage.
*   [ ] Linting and formatting are enforced automatically.
*   [ ] Security best practices (token storage, input sanitization) are implemented.
*   [ ] Documentation (JSDoc, README) is up-to-date.
*   [ ] Build and deployment pipeline (CircleCI, EAS Build) is functional and reliable.
*   [ ] Error reporting and analytics are integrated (e.g., Sentry).
*   [ ] Onboarding flow is polished.
*   [ ] Theme (light/dark modes) is consistently applied. 