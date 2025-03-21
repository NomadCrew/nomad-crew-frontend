import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Configure how notifications are presented when the app is in the foreground
export function configureNotifications() {
  // Android-specific channel creation
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Handle notification taps
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;

    if (data?.type === 'TRIP_INVITE' && data.token) {
      // Navigate to the invitation screen
      router.push({
        pathname: '/invitation',
        params: { token: data.token }
      });
    }
  });

  // Handle notifications received while app is running
  Notifications.addNotificationReceivedListener((notification) => {
    // You can handle foreground notifications here if needed
    // For example, play a sound or show an in-app banner
  });
}

// Helper function to show a local notification (useful for testing)
export async function showLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // null means show immediately
  });
} 