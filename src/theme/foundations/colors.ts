// Base color tokens - our primitive colors
export const colorTokens = {
    orange: {
      50: '#FFF7ED',
      100: '#FFE8D7',
      200: '#FFD0B5',
      300: '#FFB088',
      400: '#FF8F5E',
      500: '#F46315', // Primary brand color
      600: '#E14F04',
      700: '#BA3A02',
      800: '#942D05',
      900: '#7A2705',
    },
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    blue: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    green: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },
    red: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
    yellow: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },
  } as const;
  
  // Semantic color system
  export const createSemanticColors = (isDark: boolean) => ({
    // Interactive colors
    primary: {
      main: isDark ? colorTokens.orange[400] : colorTokens.orange[500],
      surface: isDark ? colorTokens.orange[900] : colorTokens.orange[50],
      border: isDark ? colorTokens.orange[700] : colorTokens.orange[200],
      hover: isDark ? colorTokens.orange[300] : colorTokens.orange[600],
      pressed: isDark ? colorTokens.orange[200] : colorTokens.orange[700],
      disabled: isDark ? colorTokens.orange[800] : colorTokens.orange[200],
      text: isDark ? colorTokens.orange[50] : colorTokens.orange[900],
    },
  
    // Backgrounds
    background: {
      default: isDark ? colorTokens.gray[900] : colorTokens.gray[50],
      surface: isDark ? colorTokens.gray[800] : '#FFFFFF',
      surfaceVariant: isDark ? colorTokens.gray[700] : colorTokens.gray[100],
      elevated: isDark ? colorTokens.gray[700] : '#FFFFFF',
    },
  
    // Content/Text
    content: {
      primary: isDark ? '#FFFFFF' : colorTokens.gray[900],
      secondary: isDark ? colorTokens.gray[300] : colorTokens.gray[600],
      tertiary: isDark ? colorTokens.gray[400] : colorTokens.gray[500],
      disabled: isDark ? colorTokens.gray[600] : colorTokens.gray[400],
      inverse: isDark ? colorTokens.gray[900] : '#FFFFFF',
    },
  
    // Semantic states
    status: {
      success: {
        main: colorTokens.green[500],
        surface: isDark ? colorTokens.green[900] : colorTokens.green[50],
        content: isDark ? colorTokens.green[300] : colorTokens.green[700],
        hover: isDark ? colorTokens.green[400] : colorTokens.green[600],
        pressed: isDark ? colorTokens.green[300] : colorTokens.green[700],
      },
      warning: {
        main: colorTokens.yellow[500],
        surface: isDark ? colorTokens.yellow[900] : colorTokens.yellow[50],
        content: isDark ? colorTokens.yellow[300] : colorTokens.yellow[700],
        hover: isDark ? colorTokens.yellow[400] : colorTokens.yellow[600],
        pressed: isDark ? colorTokens.yellow[300] : colorTokens.yellow[700],
      },
      error: {
        main: colorTokens.red[500],
        surface: isDark ? colorTokens.red[900] : colorTokens.red[50],
        content: isDark ? colorTokens.red[300] : colorTokens.red[700],
        hover: isDark ? colorTokens.red[400] : colorTokens.red[600],
        pressed: isDark ? colorTokens.red[300] : colorTokens.red[700],
      },
      info: {
        main: colorTokens.blue[500],
        surface: isDark ? colorTokens.blue[900] : colorTokens.blue[50],
        content: isDark ? colorTokens.blue[300] : colorTokens.blue[700],
        hover: isDark ? colorTokens.blue[400] : colorTokens.blue[600],
        pressed: isDark ? colorTokens.blue[300] : colorTokens.blue[700],
      },
    },
  
    // Border colors
    border: {
      default: isDark ? colorTokens.gray[700] : colorTokens.gray[200],
      strong: isDark ? colorTokens.gray[600] : colorTokens.gray[300],
      focus: isDark ? colorTokens.orange[400] : colorTokens.orange[500],
    },
  
    // Overlay colors for modals, loading states, etc.
    overlay: {
      background: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
      hover: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
    },
  });
  
  // Type exports
  export type ColorTokens = typeof colorTokens;
  export type SemanticColors = ReturnType<typeof createSemanticColors>;