import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/features/auth/store';
import { useTripStore } from '@/src/features/trips/store';
import { logger } from '@/src/utils/logger';
import { jwtDecode } from 'jwt-decode';

// Define token interface
interface InvitationToken {
  tripId?: string;
  inviteeEmail?: string;
  invitationId?: string;
  exp?: number;
}

// Define a type for notification data
export interface NotificationData {
  type?: string;
  tripId?: string;
  messageId?: string;
  invitationId?: string;
  senderId?: string;
  url?: string;
  [key: string]: unknown;
}

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
  Notifications.addNotificationResponseReceivedListener(async (response) => {
    const data = response.notification.request.content.data;

    if (data?.type === 'TRIP_INVITE' && data.token) {
      const token = data.token;
      logger.debug('NOTIFICATION', 'Processing invitation token', { hasToken: !!token });
      
      const { user } = useAuthStore.getState();
      
      // If user is logged in, process invitation directly
      if (user) {
        try {
          // Verify the token is valid and matches the logged-in user
          let isValid = true;
          let errorMessage = '';
          
          try {
            const decodedToken: InvitationToken = jwtDecode(token);
            logger.debug('NOTIFICATION', 'Decoded token', {
              hasTripId: !!decodedToken.tripId,
              hasInviteeEmail: !!decodedToken.inviteeEmail,
              hasInvitationId: !!decodedToken.invitationId,
              isExpired: decodedToken.exp ? decodedToken.exp * 1000 < Date.now() : false
            });
            
            // Check if token is expired
            if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
              isValid = false;
              errorMessage = 'Invitation has expired';
            }
            
            // Check if the invitation is for this user
            if (decodedToken.inviteeEmail && user.email && decodedToken.inviteeEmail !== user.email) {
              isValid = false;
              errorMessage = `This invitation was sent to ${decodedToken.inviteeEmail}, but you're logged in as ${user.email}`;
            }
          } catch (error) {
            isValid = false;
            errorMessage = 'Invalid invitation format';
            logger.error('NOTIFICATION', 'Error decoding token:', error);
          }
          
          if (isValid) {
            logger.debug('NOTIFICATION', 'Processing invitation for logged-in user');
            await useTripStore.getState().acceptInvitation(token);
            
            // Navigate to trips page
            router.replace('/(tabs)/trips');
            
            // Show success message
            Alert.alert(
              'Invitation Accepted',
              'You have been added to the trip successfully!',
              [{ text: 'OK' }]
            );
          } else {
            // Show error
            Alert.alert(
              'Invitation Error',
              errorMessage,
              [{ text: 'OK' }]
            );
          }
        } catch (error) {
          logger.error('NOTIFICATION', 'Error processing invitation:', error);
          Alert.alert(
            'Error',
            'Failed to process invitation. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // Not logged in, store the token and redirect to login
        const { persistInvitation } = useTripStore.getState();
        await persistInvitation(token);
        router.replace('/(auth)/login');
      }
    }
  });

  // Handle notifications received while app is running
  Notifications.addNotificationReceivedListener((notification) => {
    // You can handle foreground notifications here if needed
    // For example, play a sound or show an in-app banner
  });
}

// Helper function to show a local notification (useful for testing)
export async function showLocalNotification(title: string, body: string, data?: NotificationData) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // null means show immediately
  });
} 