import { Stack } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export default function LocationLayout() {
  const { theme } = useAppTheme();

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