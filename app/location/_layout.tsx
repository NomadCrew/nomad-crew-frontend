import { Stack } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function LocationLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background.default,
        },
        animation: 'slide_from_right',
      }}
    />
  );
} 