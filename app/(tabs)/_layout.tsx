import React from 'react';
import { Tabs } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Home, MapPin, Bell, User } from 'lucide-react-native';
import { AuthGuard } from '@/src/features/auth/components/AuthGuard';
import { OnboardingGate } from '@/src/components/common/OnboardingGate';

console.log('[TabsLayout] File loaded, starting TabsLayout component render');

export default function TabsLayout() {
  const { theme } = useAppTheme();
  console.log('[TabsLayout] Inside TabsLayout function - rendering');

  return (
    <AuthGuard>
      <OnboardingGate>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: theme.colors.primary.main,
            tabBarInactiveTintColor: theme.colors.content.tertiary,
            tabBarStyle: {
              backgroundColor: theme.colors.background.default,
              borderTopColor: theme.colors.border?.default || '#E5E7EB',
            },
            headerStyle: {
              backgroundColor: theme.colors.background.default,
            },
            headerTintColor: theme.colors.content.primary,
          }}
        >
          <Tabs.Screen
            name="trips"
            options={{
              title: 'Trips',
              tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="location"
            options={{
              title: 'Location',
              tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              title: 'Notifications',
              tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
              headerShown: false,
            }}
          />
        </Tabs>
      </OnboardingGate>
    </AuthGuard>
  );
} 