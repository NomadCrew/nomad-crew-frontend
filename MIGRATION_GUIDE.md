# NomadCrew UI Migration Guide

## Overview

This guide documents the migration from React Native Paper to NativeWind v4 + Gluestack UI v2 for the NomadCrew frontend application.

## Why This Migration?

### Current Stack Issues
- **React Native Paper**: Material Design focused, limiting custom design flexibility
- **Custom Theme System**: Complex and heavy, duplicating Tailwind's functionality
- **Performance**: Theme calculations happening at runtime

### New Stack Benefits
- **NativeWind v4**: Zero-runtime Tailwind CSS for React Native
- **Gluestack UI v2**: Modern, accessible, copy-paste components
- **Better Performance**: Compile-time style resolution
- **Smaller Bundle**: Only include what you use
- **Better DX**: Familiar Tailwind syntax

## Migration Strategy

### Phase 1: Setup (✅ Complete)
1. Install NativeWind v4 and dependencies
2. Configure Tailwind CSS with project colors/spacing
3. Set up Metro and Babel configuration
4. Create initial component library structure

### Phase 2: Component Migration (🚧 In Progress)
1. Create NativeWind versions of core components:
   - ✅ Button
   - ✅ Card
   - ✅ Input
   - 🔄 Modal
   - 🔄 List components
   - 🔄 Navigation components

### Phase 3: Feature Migration
Migrate features one at a time, starting with less critical screens:
1. Profile screen
2. Notifications screen
3. Trip list/details
4. Chat interface
5. Location/Maps (most complex)

### Phase 4: Theme System Update
1. Replace `useThemeColor` with Tailwind classes
2. Update `ThemedText` and `ThemedView` components
3. Remove old theme system once migration complete

## Usage Examples

### Old Way (React Native Paper)
```tsx
import { Button } from 'react-native-paper';
import { useThemeColor } from '@/hooks/useThemeColor';

function MyComponent() {
  const primaryColor = useThemeColor({}, 'primary');
  
  return (
    <Button mode="contained" onPress={handlePress}>
      Click Me
    </Button>
  );
}
```

### New Way (NativeWind)
```tsx
import { Button } from '@/src/components/ui/nativewind';

function MyComponent() {
  return (
    <Button variant="default" onPress={handlePress}>
      Click Me
    </Button>
  );
}
```

## Component Mapping

| React Native Paper | NativeWind Component | Notes |
|-------------------|---------------------|-------|
| `Button` | `Button` | Multiple variants available |
| `Card` | `Card` + sub-components | More flexible composition |
| `TextInput` | `Input` | Built-in error/helper text |
| `Surface` | `View` with classes | Use `bg-surface` class |
| `Divider` | `View` with classes | Use `border-b` class |
| `List.Item` | Custom component | Create as needed |
| `Avatar` | Custom component | Use Image with rounded classes |

## Styling Guide

### Colors
```tsx
// Primary colors
className="text-primary"           // Orange text
className="bg-primary"             // Orange background
className="border-primary"         // Orange border

// Dark mode
className="dark:text-white"        // White text in dark mode
className="dark:bg-gray-800"       // Dark background

// Semantic colors
className="text-error"             // Error red
className="text-success"           // Success green
className="text-warning"           // Warning yellow
```

### Spacing
```tsx
// Padding/Margin using custom scale
className="p-xs"    // 4px
className="p-sm"    // 8px
className="p-md"    // 16px
className="p-lg"    // 24px
className="p-xl"    // 32px

// Standard Tailwind also works
className="p-4"     // 16px
className="mt-2"    // 8px top margin
```

### Typography
```tsx
// Heading styles
className="font-heading text-xl font-bold"

// Body text
className="font-body text-base"

// Text colors with dark mode
className="text-text-primary dark:text-text-primary-dark"
```

## Best Practices

1. **Use Semantic Classes**: Prefer `bg-surface` over `bg-white`
2. **Dark Mode First**: Always include dark mode classes
3. **Component Composition**: Build complex components from primitives
4. **Utility Functions**: Use `cn()` for conditional classes
5. **Type Safety**: Define prop interfaces for all components

## Testing Components

Visit `/ui-demo` in the app to see all new components in action.

## Gradual Migration

You can use both systems side-by-side during migration:
```tsx
// Mix old and new in the same file
import { Button as PaperButton } from 'react-native-paper';
import { Button as NWButton } from '@/src/components/ui/nativewind';

// Use based on migration status
const MyButton = isNewUI ? NWButton : PaperButton;
```

## Common Gotchas

1. **Class Names**: Must be static strings, no dynamic concatenation
2. **Platform Differences**: Some Tailwind utilities don't work on native
3. **Custom Fonts**: Defined in `tailwind.config.js`, not theme
4. **Responsive Design**: Use React Native's dimensions, not Tailwind breakpoints

## Resources

- [NativeWind Documentation](https://www.nativewind.dev/)
- [Tailwind CSS Reference](https://tailwindcss.com/docs)
- [Gluestack UI Components](https://gluestack.io/ui/docs)
- Internal UI Demo: `/ui-demo` route in app