import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="verify-email" options={{ 
        headerShown: false,
        gestureEnabled: false 
      }} />
      <Stack.Screen name="invitation" options={{ 
        headerShown: false,
        gestureEnabled: false 
      }} />
    </Stack>
  );
}