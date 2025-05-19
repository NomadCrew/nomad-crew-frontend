import React from 'react';
import { Tabs } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Home, MapPin, Bell, User } from 'lucide-react-native';

export default function TabsLayout() {
  const { theme } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary.main,
        tabBarInactiveTintColor: theme.colors.content.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.background.default,
          borderTopColor: theme.colors.border.subtle,
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
        }}
      />
      <Tabs.Screen
        name="location"
        options={{
          title: 'Location',
          tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
} 