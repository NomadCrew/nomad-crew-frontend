import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          // Prevent going back to onboarding
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="email" 
        options={{
          headerShown: false,
          presentation: 'card',
          // Enable gesture on iOS
          gestureEnabled: Platform.OS === 'ios',
        }}
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          headerShown: false 
        }} 
      />
    </Stack>
  );
}