import { Stack } from 'expo-router';
import { OnboardingGate } from '@/src/components/common/OnboardingGate';

console.log('[AuthLayout] Rendering');

export default function AuthLayout() {
  return (
    <OnboardingGate>
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
    </OnboardingGate>
  );
}