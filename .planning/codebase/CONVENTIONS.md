# Coding Conventions

**Analysis Date:** 2026-01-10

## Naming Patterns

**Files:**
- `kebab-case.ts` - Utility files, services, API files
- `PascalCase.tsx` - React components
- `camelCase.ts` - Hooks (always prefixed with `use`)
- `index.ts` - Barrel exports for directories
- `*.test.ts` / `*.test.tsx` - Test files
- `*.d.ts` - Type declaration files

**Functions:**
- `camelCase` for all functions
- `handle{EventName}` for event handlers (e.g., `handleTripEvent`)
- `use{Name}` for hooks (e.g., `useAuth`, `useTripStore`)
- No special prefix for async functions
- `select{Name}` for Zustand selectors (e.g., `selectTrips`)

**Variables:**
- `camelCase` for variables and parameters
- `UPPER_SNAKE_CASE` for constants (e.g., `ACCESS_TOKEN_KEY`, `API_PATHS`)
- No underscore prefix for private members

**Types:**
- `PascalCase` for interfaces and types
- No `I` prefix for interfaces (use `User`, not `IUser`)
- `{Name}State` for store state types (e.g., `AuthState`, `TripState`)
- `{Name}Props` for component props (e.g., `ButtonProps`)
- Prefer interfaces over types for object shapes
- Avoid enums, use const objects with `as const`

## Code Style

**Formatting:**
- Prettier for auto-formatting
- 2 space indentation
- Single quotes for strings
- Semicolons required
- Max line length: Prettier default (80)
- Trailing commas in multi-line

**Linting:**
- ESLint with `eslint-config-expo`
- `@typescript-eslint` rules enabled
- `react-hooks/rules-of-hooks` error
- `react-hooks/exhaustive-deps` warn
- No console.log in production (use logger)
- Run: `npm run lint`

## Import Organization

**Order:**
1. React and React Native imports
2. External packages (expo-*, @react-*, etc.)
3. Internal modules with path aliases (`@/*`)
4. Relative imports (`./*`, `../*`)
5. Type imports (can be interleaved or at end)

**Grouping:**
- Blank line between groups
- Related imports grouped together
- Destructured imports when multiple exports used

**Path Aliases:**
- `@/*` maps to project root (`./`)
- Example: `@/src/features/auth/store`
- Configured in `tsconfig.json`

## Error Handling

**Patterns:**
- Try/catch in async store actions
- Errors logged via `logger.error(MODULE, message, error)`
- Error state set in stores (`error: string | null`)
- Graceful fallbacks in UI components

**Error Types:**
- Custom `ApiError` interface for API errors
- Supabase errors handled via error.message
- Network errors trigger retry logic
- Auth errors trigger token refresh

**Logging:**
```typescript
// Good
logger.error('AUTH', 'Login failed:', error.message);
logger.info('TRIP', 'Fetching trips...');

// Bad
console.log('error', error);
```

## Logging

**Framework:**
- Custom logger (`src/utils/logger.ts`)
- Levels: debug, info, warn, error
- Module prefixes: AUTH, TRIP, CHAT, TODO, etc.

**Patterns:**
```typescript
logger.debug('AUTH', 'Initializing auth store');
logger.info('TRIP', 'fetchTrips started.');
logger.warn('AUTH', 'Session restored but backend user missing');
logger.error('AUTH', 'Login failed:', e.message);
```

**When to Log:**
- State transitions (authenticated, logged out)
- API calls and responses
- Errors and warnings
- Debug info (controlled by environment)

## Comments

**When to Comment:**
- Explain why, not what
- Document complex business logic
- Note workarounds or temporary solutions
- JSDoc for exported functions

**JSDoc/TSDoc:**
```typescript
/**
 * Wraps its children with PaperProvider configured for the current app theme.
 *
 * @param children - Elements to render inside the themed PaperProvider
 * @returns The PaperProvider element that applies the computed paper theme
 */
function Providers({ children }: { children: React.ReactNode }) {
```

**TODO Comments:**
- Format: `// TODO: description`
- Include context about what needs to be done
- Add to endpoints that need implementation

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Extract helpers for complex logic
- Store actions can be longer (state management)

**Parameters:**
- Use object destructuring for props
- Type all parameters explicitly
- Use optional chaining and nullish coalescing

**Return Values:**
- Explicit return types for exported functions
- Return early for guard clauses
- Async functions return Promise

## Module Design

**Exports:**
- Named exports preferred
- Default exports for React components in routes
- Barrel exports via index.ts
- Selectors exported alongside stores

**Store Pattern:**
```typescript
export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // state
      user: null,
      token: null,
      loading: false,
      error: null,

      // actions
      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          // implementation
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },
    }),
    { name: 'AuthStore' }
  )
);

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectLoading = (state: AuthState) => state.loading;
```

**Component Pattern:**
```typescript
interface ComponentProps {
  title: string;
  onPress?: () => void;
}

export function Component({ title, onPress }: ComponentProps) {
  const theme = useCurrentAppTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text>{title}</Text>
    </View>
  );
}
```

## React Native Specific

**Styles:**
- Use theme values from `useCurrentAppTheme()`
- Inline styles for dynamic values
- StyleSheet.create for static styles
- Paper components for consistent UI

**Navigation:**
- Expo Router for file-based routing
- `useRouter()` for programmatic navigation
- Route groups for layout organization

**Native Modules:**
- Expo modules preferred over bare RN
- Platform-specific code via `.ios.ts` / `.android.ts`

---

*Convention analysis: 2026-01-10*
*Update when patterns change*
