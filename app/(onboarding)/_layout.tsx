import { Stack } from 'expo-router';

console.log('[OnboardingLayout] File loaded, starting OnboardingLayout component render');

export default function OnboardingLayout() {
    console.log('[OnboardingLayout] Inside OnboardingLayout function - rendering');
    return (
      <Stack 
        screenOptions={{ 
          headerShown: false, 
          gestureEnabled: false,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen 
          name="welcome" 
          options={{ 
            gestureEnabled: false,
            headerBackVisible: false,
          }} 
        />
        <Stack.Screen 
          name="permissions" 
          options={{ 
            gestureEnabled: false,
            headerBackVisible: false,
          }} 
        />
        <Stack.Screen 
          name="username" 
          options={{ 
            gestureEnabled: false,
            headerBackVisible: false,
          }} 
        />
      </Stack>
    );
  }