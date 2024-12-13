export const createSemanticColors = (isDark: boolean) => ({
    // Interactive
    primary: {
      main: isDark ? colorTokens.orange[400] : colorTokens.orange[500],
      surface: isDark ? colorTokens.orange[900] : colorTokens.orange[50],
      border: isDark ? colorTokens.orange[700] : colorTokens.orange[200],
      hover: isDark ? colorTokens.orange[300] : colorTokens.orange[600],
      pressed: isDark ? colorTokens.orange[200] : colorTokens.orange[700],
      disabled: isDark ? colorTokens.orange[800] : colorTokens.orange[200],
    },
    
    // Background
    background: {
      default: isDark ? colorTokens.gray[900] : colorTokens.gray[50],
      surface: isDark ? colorTokens.gray[800] : '#FFFFFF',
      surfaceVariant: isDark ? colorTokens.gray[700] : colorTokens.gray[100],
      elevated: isDark ? colorTokens.gray[700] : '#FFFFFF',
    },
  
    // Content
    content: {
      primary: isDark ? '#FFFFFF' : colorTokens.gray[900],
      secondary: isDark ? colorTokens.gray[300] : colorTokens.gray[600],
      tertiary: isDark ? colorTokens.gray[400] : colorTokens.gray[500],
      disabled: isDark ? colorTokens.gray[600] : colorTokens.gray[400],
    },
  
    // States
    status: {
      success: {
        main: '#10B981',
        surface: isDark ? '#064E3B' : '#ECFDF5',
        content: isDark ? '#34D399' : '#047857',
      },
      warning: {
        main: '#F59E0B',
        surface: isDark ? '#78350F' : '#FFFBEB',
        content: isDark ? '#FBBF24' : '#B45309',
      },
      error: {
        main: '#EF4444',
        surface: isDark ? '#7F1D1D' : '#FEF2F2',
        content: isDark ? '#F87171' : '#B91C1C',
      },
      info: {
        main: '#3B82F6',
        surface: isDark ? '#1E3A8A' : '#EFF6FF',
        content: isDark ? '#60A5FA' : '#1D4ED8',
      },
    },
  
    // Borders
    border: {
      default: isDark ? colorTokens.gray[700] : colorTokens.gray[200],
      strong: isDark ? colorTokens.gray[600] : colorTokens.gray[300],
      focus: isDark ? colorTokens.orange[400] : colorTokens.orange[500],
    },
  });