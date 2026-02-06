# Code style and conventions (from CLAUDE.md repo guidance)

- Prefer functional components/hooks; avoid classes.
- TypeScript strict; prefer `interface` over `type` for object shapes; avoid enums.
- Use named exports.
- Feature-based structure under `src/features/*` with components/hooks/store/types.
- UI: React Native Paper + custom theme system.
- State: Zustand stores (`useAuthStore`, `useTripStore`, etc.).
