# Suggested commands (Windows)

## Dev

- `npm start` (Expo start with cache clear)
- `npm run android`
- `npm run ios`
- `npm run web`

## Quality

- `npm run lint`
- `npm run format` / `npm run format:check`
- `npm test` / `npm run test:watch` / `npm run test:coverage`
- `npx tsc --noEmit` (or `yarn tsc` per workflow)

## EAS

- `npx eas-cli build -p ios` (interactive first-time setup)
- `npx eas-cli build -p ios --profile development --local --non-interactive`
- `npx eas-cli credentials` (manage iOS/Android signing)
- `npx eas-cli update --auto`
