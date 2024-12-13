import { Stack } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function AuthLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
    </Stack>
  );
}