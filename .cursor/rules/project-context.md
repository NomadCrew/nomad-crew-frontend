# NomadCrew Frontend Context

Last Updated: March 13, 2025

## Overview

- **App**: NomadCrew - A React Native mobile application for connecting travelers and digital nomads
- **Stack**:
  - Framework: React Native with Expo (SDK 52)
  - Language: TypeScript
  - State Management: Zustand
  - Authentication: Supabase + Social Auth (Google, Apple)
  - Navigation: Expo Router + React Navigation
  - UI Framework: React Native Paper
  - Maps & Location: Google Places, Expo Location
  - Real-time: WebSocket + SSE implementation

## Project Structure

```
src/
├── api/         # API client and endpoints
├── auth/        # Authentication flows and utilities
├── components/  # Reusable UI components
├── constants/   # App-wide constants and configuration
├── events/      # Event handling system
├── hooks/       # Custom React hooks
├── providers/   # Context providers and wrappers
├── services/    # Business logic and external services
├── store/       # Zustand stores
├── theme/       # Custom theming system
├── types/       # TypeScript type definitions
├── utils/       # Utility functions
└── websocket/   # WebSocket connection management
```

## Key Features & Integrations

### Authentication

- Supabase Auth (URL: <https://efmqiltdajvqenndmylz.supabase.co>)
- Social Authentication:
  - Apple Sign-In (Bundle ID: com.nomadcrew.app)
  - Google Sign-In
- Secure token storage with Expo SecureStore

### Navigation & Deep Linking

- File-based routing with Expo Router
- Deep link schemes:
  - `nomadcrew://` (custom scheme)
  - `https://nomadcrew.uk` (universal links)
- Deep link paths:
  - `/auth/callback` - Authentication
  - `/invite/accept` - Invite handling

### UI/UX

- React Native Paper for Material Design components
- Custom theme system (light/dark modes)
- Animations:
  - React Native Reanimated
  - Lottie animations
  - Expo Blur effects
- Maps integration with Google Places API

### State Management

- Zustand stores for:
  - Authentication state
  - User data
  - App configuration
  - Real-time data

### Real-time Features

- WebSocket implementation for live updates
- Server-Sent Events (SSE) integration
- Event system for real-time state updates

## Build Configuration

- EAS Project ID: 50d59d51-34e0-49ab-a7ee-6989ed09f8ef
- Bundle IDs:
  - iOS: com.nomadcrew.app
  - Android: com.nomadcrew.app
- Expo Updates URL: <https://u.expo.dev/50d59d51-34e0-49ab-a7ee-6989ed09f8ef>

## Development Guidelines

1. Use TypeScript strictly - no any types
2. Follow the modular architecture pattern
3. Implement proper error boundaries and loading states
4. Use React Native Paper components for UI consistency
5. Implement proper form validation with Zod
6. Follow React Native performance best practices

## Production Readiness Checklist

- [x] Project structure and architecture
- [x] Navigation setup with deep linking
- [x] Authentication flow implementation
- [x] Basic UI components and theming
- [ ] Complete user flow implementation
- [ ] Error handling and monitoring
- [ ] Performance optimization
- [ ] Testing implementation
- [ ] App store assets and metadata
- [ ] CI/CD pipeline setup

## Change Log

- March 13, 2025, 14:30 UTC: Updated project context with comprehensive documentation
- March 13, 2025, 14:00 UTC: Initialized frontend repo rules and context
