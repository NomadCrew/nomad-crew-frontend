import { Stack } from 'expo-router';

export default function OnboardingLayout() {
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