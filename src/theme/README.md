# Theme System Documentation

This document provides an overview of the theme system and how to use it correctly in your components.

## Theme Structure

The theme system is built around a consistent structure that provides access to colors, typography, spacing, and other design tokens. The main theme object is created in `create-theme.ts` and extended with additional properties in `theme-compatibility.ts`.

### Core Theme Properties

- `colors`: Semantic color tokens for the application
- `typography`: Typography styles and tokens
- `spacing`: Spacing tokens and layout values
- `elevation`: Elevation and shadow tokens
- `borderRadius`: Border radius tokens
- `components`: Component-specific styles

## Using the Theme in Components

To use the theme in your components, import the `useTheme` hook from `src/theme/ThemeProvider`:

```tsx
import { useTheme } from '@/src/theme/ThemeProvider';

const MyComponent = () => {
  const { theme } = useTheme();
  
  return (
    <View style={styles(theme).container}>
      <Text style={styles(theme).text}>Hello World</Text>
    </View>
  );
};

const styles = (theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.default,
    padding: theme.spacing.inset.md,
    borderRadius: theme.borderRadius.md,
  },
  text: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.md,
  },
});
```

## Typography

The theme provides consistent typography sizes through `theme.typography.size`:

```tsx
// Font sizes
theme.typography.size.xs  // 12
theme.typography.size.sm  // 14
theme.typography.size.md  // 16
theme.typography.size.lg  // 18
theme.typography.size.xl  // 20
theme.typography.size['2xl']  // 24
theme.typography.size['3xl']  // 30
theme.typography.size['4xl']  // 36
theme.typography.size['5xl']  // 48
```

## Border Radius

The theme provides consistent border radius values through `theme.borderRadius`:

```tsx
// Border radius values
theme.borderRadius.none  // 0
theme.borderRadius.sm    // 4
theme.borderRadius.md    // 8
theme.borderRadius.lg    // 12
theme.borderRadius.xl    // 16
theme.borderRadius.full  // 9999
```

## Colors

The theme provides semantic color tokens:

```tsx
// Primary colors
theme.colors.primary.main
theme.colors.primary.light
theme.colors.primary.dark
theme.colors.primary.contrastText

// Background colors
theme.colors.background.default
theme.colors.background.paper
theme.colors.background.surface

// Text colors
theme.colors.text.primary
theme.colors.text.secondary
theme.colors.text.disabled

// Status colors
theme.colors.error
theme.colors.warning
theme.colors.success
theme.colors.info
```

## Spacing

The theme provides consistent spacing values:

```tsx
// Inset spacing (padding)
theme.spacing.inset.xs
theme.spacing.inset.sm
theme.spacing.inset.md
theme.spacing.inset.lg
theme.spacing.inset.xl

// Stack spacing (margin between stacked elements)
theme.spacing.stack.xs
theme.spacing.stack.sm
theme.spacing.stack.md
theme.spacing.stack.lg
theme.spacing.stack.xl

// Inline spacing (margin between inline elements)
theme.spacing.inline.xs
theme.spacing.inline.sm
theme.spacing.inline.md
theme.spacing.inline.lg
theme.spacing.inline.xl
```

## Best Practices

1. Always use the theme properties instead of hardcoded values
2. Create a styles function that takes the theme as a parameter
3. Use semantic color tokens instead of specific color values
4. Use the spacing and typography tokens for consistent UI
5. For component-specific styles, check if they exist in `theme.components` first 