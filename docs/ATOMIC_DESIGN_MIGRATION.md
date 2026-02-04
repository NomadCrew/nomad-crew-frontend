# Atomic Design Migration Guide

## Overview

This document tracks the ongoing migration of the NomadCrew frontend to an atomic design architecture. The migration is being done incrementally to ensure application stability.

## Migration Status

### ✅ Completed

#### 1. Directory Structure
Created atomic design structure at `src/components/`:
```
src/components/
├── atoms/          # Basic building blocks
├── molecules/      # Combinations of atoms
├── organisms/      # Complex components
└── templates/      # Page-level layouts
```

#### 2. Migrated Components

**Atoms:**
- ✅ `ThemedText` - Text component with theme typography/colors
- ✅ `ThemedView` - View component with theme background/elevation
- ✅ `Stack` - Vertical layout with spacing
- ✅ `Inline` - Horizontal layout with spacing
- ✅ `Container` - Content container with variants
- ✅ `Badge` - Status indicator (created but not fully integrated due to conflicts)
- ✅ `Tag` - Status/categorization labels with variants
- ✅ `WeatherIcon` - Weather icon display with conditions
- ✅ `AppButton` - Custom button with theme-aware styling (namespaced to avoid Paper conflicts)
- ✅ `AppCard` - Elevated surface container (namespaced to avoid Paper conflicts)

**Molecules:**
- ✅ `BentoGrid` - Responsive grid layout with variable height cards
- ✅ `BentoCarousel` - Carousel with parallax effects

**Import Updates:**
- Updated 24 files to use new import paths
- Old: `@/src/components/ThemedText`, `@/src/components/ui/WeatherIcon`, `@/components/ui/BentoGrid`
- New: `@/src/components/atoms/ThemedText`, `@/src/components/atoms/WeatherIcon`, `@/src/components/molecules/BentoGrid`

### 🚧 In Progress

#### Components with Conflicts
These components exist in our codebase but conflict with react-native-paper:
- ✅ Button → `AppButton` (Migrated as namespaced version)
- ✅ Card → `AppCard` (Migrated as namespaced version)
- Chip
- Divider
- Avatar
- IconButton
- TextInput

**Strategy:** Creating namespaced versions (AppButton, AppCard, etc.) to avoid conflicts.

### 📋 Pending Migration

#### Safe to Migrate (No Conflicts)
- ✅ `Tag` - Custom tag component (Migrated)
- ✅ `WeatherIcon` - Weather icon display (Migrated)
- ✅ `BentoGrid` - Grid layout system (Migrated as molecule)
- ✅ `BentoCarousel` - Carousel component (Migrated as molecule)
- Platform-specific components (TabBarBackground, IconSymbol)

#### Feature Components (Keep in Features)
- TripCard, ChatMessage, NotificationItem, etc.
- These will remain in their feature folders for domain cohesion

## Migration Process

### Phase 1: Foundation (Current)
1. ✅ Set up atomic structure
2. ✅ Migrate non-conflicting atoms
3. ✅ Update imports incrementally
4. ✅ Test each migration

### Phase 2: Conflict Resolution
1. Create compatibility layer for Paper components
2. Namespace our components (e.g., `AppButton` vs Paper's `Button`)
3. Gradually migrate dependent components

### Phase 3: Documentation
1. Component documentation with atomic level
2. Usage examples
3. Storybook setup

## Scripts

### Update Imports
```bash
node scripts/update-themed-imports.js
```

### Migration Helper
```bash
node scripts/atomic-migration.js
```

## Component Documentation Template

```typescript
/**
 * @atomic-level atom|molecule|organism|template
 * @description Brief description
 * @composition List of composed components
 * @example
 * ```tsx
 * <Component prop="value" />
 * ```
 */
```

## Best Practices

1. **Incremental Migration**: Move components one at a time
2. **Test After Each Step**: Ensure app builds and runs
3. **Update Imports**: Use provided scripts to update imports
4. **Document Changes**: Add atomic-level documentation
5. **Preserve Functionality**: Don't break existing features

## Troubleshooting

### Import Errors
If you see import errors after migration:
1. Check the new import path in `src/components/atoms/index.ts`
2. Ensure the component was properly migrated
3. Run the import update script

### Type Errors
The codebase has pre-existing TypeScript errors. Focus on:
- New errors introduced by migration
- Import path resolution errors

### Conflicts with Libraries
For components that conflict with react-native-paper:
1. Keep using Paper's version for now
2. Plan for namespaced versions in Phase 2

## Next Steps

1. Continue migrating non-conflicting components
2. Create molecules from existing compound components
3. Set up Storybook for component documentation
4. Implement visual regression testing

## Resources

- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/)
- [Original Analysis](./ATOMIC_DESIGN_ANALYSIS.md)
- [React Native Paper](https://callstack.github.io/react-native-paper/)