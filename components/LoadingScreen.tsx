import { View, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export function LoadingScreen() {
  const { theme } = useAppTheme();
  
  return (
    <View 
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface.default,
      }}
    >
      <ActivityIndicator 
        size="large" 
        color={theme.colors.primary.main} 
      />
    </View>
  );
}