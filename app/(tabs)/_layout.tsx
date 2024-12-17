import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useTheme } from '@/src/theme';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary.main,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface.default,
            borderTopColor: theme.colors.surface.variant,
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="backpack.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="paperplane.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}