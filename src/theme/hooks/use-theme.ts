export function useThemeColor(colorKey: keyof SemanticColors) {
    const theme = useTheme();
    return theme.colors[colorKey];
  }
  
  export function useComponentStyle<T extends keyof Theme['components']>(
    component: T,
    variant?: string,
    size?: string
  ) {
    const theme = useTheme();
    const componentStyles = theme.components[component];
    
    return {
      ...componentStyles.base,
      ...(variant && componentStyles.variants[variant]),
      ...(size && componentStyles.sizes[size]),
    };
  }