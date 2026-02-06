# When done (verification checklist)

- Run `npm run lint`.
- Run `npx tsc --noEmit` (or `yarn tsc`).
- Run `npm test` if changes affect logic.
- For CI/CD changes: validate workflow runs and secrets/vars exist.
