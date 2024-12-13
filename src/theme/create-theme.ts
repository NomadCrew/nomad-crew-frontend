export function createTheme(options: ThemeOptions = {}) {
    const {
      isDark = false,
      fontFamily = 'Inter',
      spacing: customSpacing,
      borderRadius: customBorderRadius,
    } = options;
  
    const semanticColors = createSemanticColors(isDark);
    const typography = createTypography(fontFamily);
  
    return {
      colors: semanticColors,
      typography,
      spacing: {
        ...spacing,
        ...customSpacing,
      },
      borderRadius: {
        ...borderRadius,
        ...customBorderRadius,
      },
      // Add component styles
      components: {
        Button: {
          base: {
            height: 48,
            borderRadius: 8,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          },
          variants: {
            primary: {
              backgroundColor: semanticColors.primary.main,
              color: '#FFFFFF',
            },
            secondary: {
              backgroundColor: semanticColors.background.surfaceVariant,
              color: semanticColors.content.primary,
            },
            // Add other variants...
          },
          sizes: {
            sm: {
              height: 32,
              paddingHorizontal: 12,
              ...typography.styles.button,
              fontSize: 14,
            },
            md: {
              height: 40,
              paddingHorizontal: 16,
              ...typography.styles.button,
            },
            lg: {
              height: 48,
              paddingHorizontal: 20,
              ...typography.styles.button,
              fontSize: 18,
            },
          },
        },
        // Add other component styles...
      },
    };
  }