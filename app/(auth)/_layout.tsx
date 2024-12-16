import { Stack } from 'expo-router';
import { AuthProvider } from '@/src/auth/auth-context';
import { ThemeProvider } from '@/src/theme/ThemeProvider';

export default function AuthLayout() {
  
  return (
    <AuthProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}