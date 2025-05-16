import { Tabs } from 'expo-router';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/src/theme';
import { Platform, View } from 'react-native';
import { NotificationBadge } from '@/src/components/notifications';
import { useNotificationStore } from '@/src/store/useNotificationStore';

export default function TabLayout() {
  const { theme } = useTheme();
  const { unreadCount } = useNotificationStore();
  
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: theme.colors.primary.main,
        tabBarInactiveTintColor: theme.colors.content.tertiary,
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface.variant,
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitle: '',
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
              iconName = focused ? 'airplane' : 'airplane-outline';
              break;
            case 'explore':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'notifications':
              iconName = focused ? 'notifications' : 'notifications-outline';
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
      <Tabs.Screen 
        name="notifications" 
        options={{ 
          title: 'Notifications',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }} 
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}