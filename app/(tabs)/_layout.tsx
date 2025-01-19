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
        tabBarActiveTintColor: theme.colors.primary.main,
        tabBarInactiveTintColor: theme.colors.content.tertiary,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          borderTopLeftRadius: 1,
          borderTopRightRadius: 1,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          backgroundColor: theme.colors.surface.variant,
          borderTopWidth: 0.5,
          borderTopColor: theme.colors.content.tertiary,
          height: 64,
          paddingBottom: Platform.OS === 'ios' ? 4 : 0,
          paddingTop: 4,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarItemStyle: {
          paddingBottom: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          paddingBottom: 2,
        },
        tabBarIcon: ({ focused, color }) => {
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

          return <Ionicons name={iconName as any} size={24} color={color} />;
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