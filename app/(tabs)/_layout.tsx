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
          borderWidth: 0,
          backgroundColor: theme.colors.surface.variant,
          borderTopWidth: 0.2,
          borderBottomWidth:0,
          shadowColor: 'transparent',
          elevation: 0,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0, 
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

          return <Ionicons name={iconName as any} size={28} color={color} />;
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
