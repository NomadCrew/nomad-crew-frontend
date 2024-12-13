import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        tabBarShowLabel: false, // This hides the tab labels
      }}>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="backpack.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="paperplane.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}