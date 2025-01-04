import { Tabs } from 'expo-router';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/src/theme';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: theme.colors.primary.onPrimary,
        tabBarInactiveTintColor: theme.colors.content.secondary,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute', 
          bottom: Platform.OS === 'ios' ? theme.spacing.stack.md : theme.spacing.stack.sm,
          marginHorizontal: theme.spacing.inline.lg,
          borderRadius: theme.spacing.stack.xl,
          height: 70, 
          backgroundColor: theme.colors.surface.default, 
          borderWidth: 1, 
          borderColor: theme.colors.surface.variant, 
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'trips':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'explore':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              return null;
          }

          return <Ionicons name={iconName} size={28} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="trips" options={{ title: 'Trips' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
