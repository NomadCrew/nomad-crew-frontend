# nomad-crew-frontend overview

- Purpose: NomadCrew mobile app frontend for group travel coordination.
- Stack: React Native + Expo (SDK ~52), TypeScript, Expo Router, Zustand, React Native Paper, Supabase, Jest.
- Key config: `app.config.js` uses `APP_VARIANT` to choose dev vs prod identifiers and config. EAS `projectId` present.
- iOS bundle IDs: `com.nomadcrew.app.dev` (dev) and `com.nomadcrew.app` (prod).
- Android package: same pattern.
