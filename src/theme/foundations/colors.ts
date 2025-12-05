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
  pastel: {
    blue: '#E6F2FF',
    green: '#E6F7F2',
    lavender: '#F0E6FF',
    peach: '#FFF0E6',
    mint: '#E6FFF0',
    cream: '#FFF9E6',
    blush: '#FFE6E6',
    sky: '#E6FAFF',
    blueDark: '#D1E5F9',
    creamDark: '#F5ECD6',
    peachLight: '#FFDACB',
    peachMedium: '#FFB8A8',
    peachDark: '#E8A598',
    coral: '#C99A94',
    darkPeach: '#B06048',
    darkCoral: '#8A4A3F',
    lightPeach: '#FFE8DC',
  },
} as const;

// Semantic color system
export const createSemanticColors = (isDark: boolean) => ({
  // Interactive colors
  primary: {
    main: isDark ? colorTokens.orange[400] : colorTokens.orange[700],
    default: isDark ? colorTokens.orange[400] : colorTokens.orange[700],
    surface: isDark ? colorTokens.orange[900] : colorTokens.orange[50],
    border: isDark ? colorTokens.orange[700] : colorTokens.orange[300],
    hover: isDark ? colorTokens.orange[300] : colorTokens.orange[800],
    pressed: isDark ? colorTokens.orange[200] : colorTokens.orange[900],
    disabled: isDark ? colorTokens.orange[800] : colorTokens.orange[200],
    text: isDark ? colorTokens.orange[50] : '#FFFFFF',
    onPrimary: '#FFFFFF',
  },

  // Content
  content: {
    primary: isDark ? '#F8FAFC' : '#1A1A1A',
    secondary: isDark ? '#CBD5E1' : '#404040',
    tertiary: isDark ? '#555555' : '#555555',
    disabled: isDark ? '#475569' : '#D4D4D4',
    onSurface: isDark ? '#FFFFFF' : colorTokens.gray[900],
    onSurfaceVariant: isDark ? colorTokens.gray[300] : colorTokens.gray[700],
    onImage: '#FFFFFF',
  },

  // Text alias - points to content for backward compatibility
  text: {
    primary: isDark ? '#F8FAFC' : '#1A1A1A',
    secondary: isDark ? '#CBD5E1' : '#404040',
    tertiary: isDark ? '#555555' : '#555555',
    disabled: isDark ? '#475569' : '#D4D4D4',
    onPrimary: '#FFFFFF', // Text color on primary color background
  },

  // Surface colors
  surface: {
    default: isDark ? colorTokens.gray[900] : colorTokens.pastel.peachLight,
    variant: isDark ? colorTokens.gray[800] : colorTokens.pastel.darkPeach,
  },
  status: {
    error: {
      surface: isDark ? colorTokens.red[900] : colorTokens.red[50],
      content: isDark ? colorTokens.red[300] : colorTokens.red[800],
      background: isDark ? colorTokens.red[800] : colorTokens.red[100],
      border: isDark ? colorTokens.red[700] : colorTokens.red[300],
      main: isDark ? colorTokens.red[400] : colorTokens.red[500],
    },
    success: {
      surface: isDark ? colorTokens.green[800] : colorTokens.green[50],
      content: isDark ? colorTokens.green[200] : colorTokens.green[800],
      background: isDark ? colorTokens.green[700] : colorTokens.green[100],
      border: isDark ? colorTokens.green[800] : colorTokens.green[300],
      main: isDark ? colorTokens.green[400] : colorTokens.green[500],
    },
    warning: {
      surface: isDark ? colorTokens.yellow[900] : colorTokens.yellow[50],
      content: isDark ? colorTokens.yellow[300] : colorTokens.yellow[800],
      background: isDark ? colorTokens.yellow[800] : colorTokens.yellow[100],
      border: isDark ? colorTokens.yellow[700] : colorTokens.yellow[300],
      main: isDark ? colorTokens.yellow[400] : colorTokens.yellow[500],
    },
    info: {
      surface: isDark ? colorTokens.blue[900] : colorTokens.blue[50],
      content: isDark ? colorTokens.blue[300] : colorTokens.blue[800],
      background: isDark ? colorTokens.blue[800] : colorTokens.blue[100],
      border: isDark ? colorTokens.blue[700] : colorTokens.blue[300],
      main: isDark ? colorTokens.blue[400] : colorTokens.blue[500],
    },
    planning: {
      background: isDark ? colorTokens.orange[800] : colorTokens.orange[100],
      content: isDark ? colorTokens.orange[200] : colorTokens.orange[800],
    },
    completed: {
      background: isDark ? colorTokens.gray[800] : colorTokens.gray[100],
      content: isDark ? colorTokens.gray[200] : colorTokens.gray[800],
    },
  },
  // Add missing direct error/warning/success/info properties
  error: {
    surface: isDark ? colorTokens.red[900] : colorTokens.red[50],
    main: isDark ? colorTokens.red[400] : colorTokens.red[500],
  },
  success: {
    surface: isDark ? colorTokens.green[800] : colorTokens.green[50],
    main: isDark ? colorTokens.green[400] : colorTokens.green[500],
  },
  warning: {
    surface: isDark ? colorTokens.yellow[900] : colorTokens.yellow[50],
    main: isDark ? colorTokens.yellow[400] : colorTokens.yellow[500],
  },
  info: {
    surface: isDark ? colorTokens.blue[900] : colorTokens.blue[50],
    main: isDark ? colorTokens.blue[400] : colorTokens.blue[500],
  },
  // Add disabled state
  disabled: {
    background: isDark ? colorTokens.gray[800] : colorTokens.gray[200],
    text: isDark ? colorTokens.gray[600] : colorTokens.gray[400],
    border: isDark ? colorTokens.gray[700] : colorTokens.gray[300],
  },
  outlined: {
    background: 'transparent',
    text: isDark ? colorTokens.orange[400] : colorTokens.orange[700],
    border: isDark ? colorTokens.orange[700] : colorTokens.orange[300],
  },
  // Alias for outlined (for backward compatibility)
  outline: {
    background: 'transparent',
    text: isDark ? colorTokens.orange[400] : colorTokens.orange[700],
    border: isDark ? colorTokens.orange[700] : colorTokens.orange[300],
  },
  // Top-level onPrimary for backward compatibility
  onPrimary: '#FFFFFF',
  border: {
    default: isDark ? colorTokens.gray[700] : colorTokens.pastel.darkCoral,
    strong: isDark ? colorTokens.gray[600] : colorTokens.pastel.darkCoral,
  },
  background: {
    default: isDark ? colorTokens.gray[900] : colorTokens.pastel.lightPeach,
    primary: isDark ? colorTokens.gray[900] : colorTokens.pastel.lightPeach,
    surface: isDark ? colorTokens.gray[800] : colorTokens.pastel.peachMedium,
    card: isDark ? colorTokens.gray[800] : '#FFFFFF',
    elevated: isDark ? colorTokens.gray[800] : '#FFFFFF',
    selected: isDark ? colorTokens.gray[700] : colorTokens.pastel.peachDark,
  },
  chat: {
    userBubble: {
      background: isDark ? '#BA3A02' : '#BA3A02',
      text: '#FFFFFF',
      meta: isDark ? '#FFD0B5' : '#FFE8D7',
    },
    otherBubble: {
      background: isDark ? colorTokens.gray[700] : '#F3F4F6',
      text: isDark ? '#FFFFFF' : '#1F2937',
      meta: isDark ? colorTokens.gray[400] : '#4B5563',
      sender: isDark ? colorTokens.orange[300] : '#BA3A02',
    },
    typing: {
      text: isDark ? colorTokens.gray[300] : '#4B5563',
    },
    readReceipt: {
      icon: isDark ? colorTokens.blue[400] : colorTokens.blue[600],
      text: isDark ? colorTokens.gray[300] : colorTokens.gray[600],
    },
  },
});

// Add color value type
export type ColorValue = string;

// Update semantic colors type
export type SemanticColors = ReturnType<typeof createSemanticColors>;
