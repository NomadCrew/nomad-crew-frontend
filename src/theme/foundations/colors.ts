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
    // NEW: Purple color scale for role differentiation
    purple: {
      50: '#FAF5FF',
      100: '#F3E8FF',
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#A855F7',
      600: '#9333EA',
      700: '#7C3AED',
      800: '#6B21A8',
      900: '#581C87',
    },
    // NEW: Indigo for secondary roles
    indigo: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1',
      600: '#4F46E5',
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81',
    },
    // NEW: Teal for utility colors
    teal: {
      50: '#F0FDFA',
      100: '#CCFBF1',
      200: '#99F6E4',
      300: '#5EEAD4',
      400: '#2DD4BF',
      500: '#14B8A6',
      600: '#0D9488',
      700: '#0F766E',
      800: '#115E59',
      900: '#134E4A',
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
      // NEW: Additional pastel variants
      purple: '#F3E8FF',
      purpleDark: '#E9D5FF',
      indigo: '#E0E7FF',
      indigoDark: '#C7D2FE',
      teal: '#F0FDFA',
      tealDark: '#CCFBF1',
    },
  } as const;
  
  // Semantic color system
  export const createSemanticColors = (isDark: boolean) => ({
    // Interactive colors
    primary: {
      main: isDark ? colorTokens.orange[400] : colorTokens.orange[700],
      container: isDark ? colorTokens.orange[800] : '#FFF7ED',
      containerSoft: isDark ? colorTokens.orange[900] : '#FFF7ED',
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
  
    // Surface colors
    surface: {
      main: isDark ? colorTokens.gray[800] : '#FFFFFF',
      default: isDark ? colorTokens.gray[900] : colorTokens.pastel.peachLight,
      variant: isDark ? colorTokens.gray[800] : colorTokens.pastel.darkPeach,
      containerHighest: isDark ? colorTokens.gray[700] : '#F9FAFB',
      disabled: isDark ? colorTokens.gray[700] : '#F3F4F6',
    },

    // NEW: Trip Status Colors
    tripStatus: {
      draft: {
        background: isDark ? colorTokens.gray[800] : colorTokens.gray[100],
        content: isDark ? colorTokens.gray[300] : colorTokens.gray[700],
        border: isDark ? colorTokens.gray[700] : colorTokens.gray[300],
        icon: isDark ? colorTokens.gray[400] : colorTokens.gray[600],
      },
      planning: {
        background: isDark ? colorTokens.orange[900] : colorTokens.orange[50],
        content: isDark ? colorTokens.orange[300] : colorTokens.orange[800],
        border: isDark ? colorTokens.orange[700] : colorTokens.orange[300],
        icon: isDark ? colorTokens.orange[400] : colorTokens.orange[600],
      },
      active: {
        background: isDark ? colorTokens.blue[900] : colorTokens.blue[50],
        content: isDark ? colorTokens.blue[300] : colorTokens.blue[800],
        border: isDark ? colorTokens.blue[700] : colorTokens.blue[300],
        icon: isDark ? colorTokens.blue[400] : colorTokens.blue[600],
      },
      completed: {
        background: isDark ? colorTokens.green[900] : colorTokens.green[50],
        content: isDark ? colorTokens.green[300] : colorTokens.green[800],
        border: isDark ? colorTokens.green[700] : colorTokens.green[300],
        icon: isDark ? colorTokens.green[400] : colorTokens.green[600],
      },
      cancelled: {
        background: isDark ? colorTokens.red[900] : colorTokens.red[50],
        content: isDark ? colorTokens.red[300] : colorTokens.red[800],
        border: isDark ? colorTokens.red[700] : colorTokens.red[300],
        icon: isDark ? colorTokens.red[400] : colorTokens.red[600],
      },
    },

    // NEW: Member Role Colors
    memberRoles: {
      owner: {
        background: isDark ? colorTokens.purple[900] : colorTokens.purple[50],
        content: isDark ? colorTokens.purple[200] : colorTokens.purple[800],
        border: isDark ? colorTokens.purple[700] : colorTokens.purple[300],
        icon: isDark ? colorTokens.purple[400] : colorTokens.purple[600],
        badge: isDark ? colorTokens.purple[700] : colorTokens.purple[600],
      },
      admin: {
        background: isDark ? colorTokens.indigo[900] : colorTokens.indigo[50],
        content: isDark ? colorTokens.indigo[200] : colorTokens.indigo[800],
        border: isDark ? colorTokens.indigo[700] : colorTokens.indigo[300],
        icon: isDark ? colorTokens.indigo[400] : colorTokens.indigo[600],
        badge: isDark ? colorTokens.indigo[700] : colorTokens.indigo[600],
      },
      moderator: {
        background: isDark ? colorTokens.teal[900] : colorTokens.teal[50],
        content: isDark ? colorTokens.teal[200] : colorTokens.teal[800],
        border: isDark ? colorTokens.teal[700] : colorTokens.teal[300],
        icon: isDark ? colorTokens.teal[400] : colorTokens.teal[600],
        badge: isDark ? colorTokens.teal[700] : colorTokens.teal[600],
      },
      member: {
        background: isDark ? colorTokens.blue[900] : colorTokens.blue[50],
        content: isDark ? colorTokens.blue[200] : colorTokens.blue[800],
        border: isDark ? colorTokens.blue[700] : colorTokens.blue[300],
        icon: isDark ? colorTokens.blue[400] : colorTokens.blue[600],
        badge: isDark ? colorTokens.blue[700] : colorTokens.blue[600],
      },
      viewer: {
        background: isDark ? colorTokens.gray[800] : colorTokens.gray[100],
        content: isDark ? colorTokens.gray[300] : colorTokens.gray[700],
        border: isDark ? colorTokens.gray[700] : colorTokens.gray[300],
        icon: isDark ? colorTokens.gray[400] : colorTokens.gray[600],
        badge: isDark ? colorTokens.gray[600] : colorTokens.gray[500],
      },
    },

    // NEW: Presence Indicators
    presence: {
      online: {
        indicator: isDark ? colorTokens.green[400] : colorTokens.green[500],
        background: isDark ? colorTokens.green[900] : colorTokens.green[50],
        content: isDark ? colorTokens.green[200] : colorTokens.green[800],
        glow: isDark ? `${colorTokens.green[400]}40` : `${colorTokens.green[500]}20`,
      },
      away: {
        indicator: isDark ? colorTokens.yellow[400] : colorTokens.yellow[500],
        background: isDark ? colorTokens.yellow[900] : colorTokens.yellow[50],
        content: isDark ? colorTokens.yellow[200] : colorTokens.yellow[800],
        glow: isDark ? `${colorTokens.yellow[400]}40` : `${colorTokens.yellow[500]}20`,
      },
      busy: {
        indicator: isDark ? colorTokens.red[400] : colorTokens.red[500],
        background: isDark ? colorTokens.red[900] : colorTokens.red[50],
        content: isDark ? colorTokens.red[200] : colorTokens.red[800],
        glow: isDark ? `${colorTokens.red[400]}40` : `${colorTokens.red[500]}20`,
      },
      offline: {
        indicator: isDark ? colorTokens.gray[600] : colorTokens.gray[400],
        background: isDark ? colorTokens.gray[800] : colorTokens.gray[100],
        content: isDark ? colorTokens.gray[400] : colorTokens.gray[600],
        glow: isDark ? `${colorTokens.gray[600]}20` : `${colorTokens.gray[400]}10`,
      },
      typing: {
        indicator: isDark ? colorTokens.blue[400] : colorTokens.blue[500],
        background: isDark ? colorTokens.blue[900] : colorTokens.blue[50],
        content: isDark ? colorTokens.blue[200] : colorTokens.blue[800],
        animation: isDark ? colorTokens.blue[400] : colorTokens.blue[500],
      },
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
        content: isDark ? colorTokens.orange[200] : colorTokens.orange[800]
      },
      completed: {
        background: isDark ? colorTokens.gray[800] : colorTokens.gray[100],
        content: isDark ? colorTokens.gray[200] : colorTokens.gray[800]
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
    border: {
      default: isDark ? colorTokens.gray[700] : colorTokens.pastel.darkCoral,
      strong: isDark ? colorTokens.gray[600] : colorTokens.pastel.darkCoral,
    },
    background: {
      default: isDark ? colorTokens.gray[900] : colorTokens.pastel.lightPeach,
      surface: isDark ? colorTokens.gray[800] : colorTokens.pastel.peachMedium,
      elevated: isDark ? colorTokens.gray[800] : '#FFFFFF',
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
      }
    },
    // Outline colors
    outline: {
      default: isDark ? colorTokens.gray[600] : '#E5E7EB',
      strong: isDark ? colorTokens.gray[500] : colorTokens.gray[400],
    },
    // Feedback colors
    feedback: {
      error: {
        main: isDark ? colorTokens.red[400] : '#EF4444',
        surface: isDark ? colorTokens.red[900] : colorTokens.red[50],
        content: isDark ? colorTokens.red[300] : colorTokens.red[800],
        background: isDark ? colorTokens.red[800] : colorTokens.red[100],
        border: isDark ? colorTokens.red[700] : colorTokens.red[300],
      },
      success: {
        main: isDark ? colorTokens.green[400] : colorTokens.green[500],
        surface: isDark ? colorTokens.green[800] : colorTokens.green[50],
        content: isDark ? colorTokens.green[200] : colorTokens.green[800],
        background: isDark ? colorTokens.green[700] : colorTokens.green[100],
        border: isDark ? colorTokens.green[800] : colorTokens.green[300],
      },
      warning: {
        main: isDark ? colorTokens.yellow[400] : colorTokens.yellow[500],
        surface: isDark ? colorTokens.yellow[900] : colorTokens.yellow[50],
        content: isDark ? colorTokens.yellow[300] : colorTokens.yellow[800],
        background: isDark ? colorTokens.yellow[800] : colorTokens.yellow[100],
        border: isDark ? colorTokens.yellow[700] : colorTokens.yellow[300],
      },
      info: {
        main: isDark ? colorTokens.blue[400] : colorTokens.blue[500],
        surface: isDark ? colorTokens.blue[900] : colorTokens.blue[50],
        content: isDark ? colorTokens.blue[300] : colorTokens.blue[800],
        background: isDark ? colorTokens.blue[800] : colorTokens.blue[100],
        border: isDark ? colorTokens.blue[700] : colorTokens.blue[300],
      },
    },
  });
  
  // Add color value type
  export type ColorValue = string;
  
  // Update semantic colors type
  export type SemanticColors = ReturnType<typeof createSemanticColors>;