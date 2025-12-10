/**
 * Notifications utility module with simulator-safe handling
 *
 * IMPORTANT: Push notifications don't work on iOS simulators due to APNs limitations.
 * This module uses dynamic imports to prevent expo-notifications from loading on simulators,
 * which would cause Keychain access errors.
 *
 * References:
 * - https://docs.expo.dev/push-notifications/faq/
 * - https://stackoverflow.com/questions/77033620/how-to-send-expo-push-notifications-for-ios-simulator-in-react-native-app
 */

import { Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/features/auth/store';
import { useTripStore } from '@/src/features/trips/store';
import { logger } from '@/src/utils/logger';
import { jwtDecode } from 'jwt-decode';
import Constants from 'expo-constants';

// Lazy-loaded Notifications module - only imported on physical devices
let Notifications: typeof import('expo-notifications') | null = null;

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
  tripID?: string; // Backend uses camelCase
  tripName?: string;
  messageId?: string;
  invitationId?: string;
  invitationID?: string; // Backend uses camelCase
  inviterName?: string;
  inviterID?: string;
  senderId?: string;
  url?: string;
  token?: string; // JWT token for invitation (legacy)
  notificationId?: string;
  [key: string]: unknown;
}

// Helper to check if we're on a physical device
// Push notifications don't work on simulators/emulators
const isPhysicalDevice = (): boolean => {
  // Constants.isDevice is true for physical devices, false for simulators/emulators
  // This check happens before any notification module import
  return Constants.isDevice === true;
};

/**
 * Handle a notification response (from tap).
 * This is extracted into a separate function to handle both:
 * 1. Cold start - app was killed, user taps notification to open it
 * 2. Warm start - app is running (foreground/background), user taps notification
 */
async function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as NotificationData;

  console.log('[NOTIFICATION] Extracted data:', JSON.stringify(data, null, 2));
  logger.debug('NOTIFICATION', 'Notification tapped', {
    type: data?.type,
    hasData: !!data,
    keys: data ? Object.keys(data) : [],
  });

  // Handle trip invitation notifications
  console.log('[NOTIFICATION] Checking notification type:', data?.type);
  if (data?.type === 'TRIP_INVITATION_RECEIVED' || data?.type === 'TRIP_INVITATION') {
    console.log('[NOTIFICATION] Matched TRIP_INVITATION type!');
    const tripId = data.tripID || data.tripId;
    const invitationId = data.invitationID || data.invitationId;
    const tripName = data.tripName;
    const inviterName = data.inviterName;

    console.log('[NOTIFICATION] Extracted invitation details:', {
      tripId,
      invitationId,
      tripName,
      inviterName,
    });
    logger.debug('NOTIFICATION', 'Processing trip invitation tap', {
      tripId,
      invitationId,
      tripName,
      inviterName,
    });

    const { user } = useAuthStore.getState();
    console.log('[NOTIFICATION] User state:', { hasUser: !!user, userId: user?.id });

    if (user) {
      console.log('[NOTIFICATION] User is logged in, navigating to notifications');
      // For invitation notifications, navigate to notifications tab
      // The user needs to accept/decline the invitation before viewing the trip
      // (They won't have permission to view trip details until they're a member)
      console.log('[NOTIFICATION] Navigating to notifications tab to handle invitation');
      router.push('/(tabs)/notifications');
    } else {
      // Not logged in - redirect to login
      console.log('[NOTIFICATION] User not logged in, redirecting to auth');
      logger.debug('NOTIFICATION', 'User not logged in, redirecting to auth');
      router.replace('/(auth)/login');
    }
    return;
  }

  // Handle legacy TRIP_INVITE with token (for backward compatibility)
  if (data?.type === 'TRIP_INVITE' && data.token) {
    const token = data.token as string;
    logger.debug('NOTIFICATION', 'Processing legacy invitation token', { hasToken: !!token });

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
            isExpired: decodedToken.exp ? decodedToken.exp * 1000 < Date.now() : false,
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
          Alert.alert('Invitation Accepted', 'You have been added to the trip successfully!', [
            { text: 'OK' },
          ]);
        } else {
          // Show error
          Alert.alert('Invitation Error', errorMessage, [{ text: 'OK' }]);
        }
      } catch (error) {
        logger.error('NOTIFICATION', 'Error processing invitation:', error);
        Alert.alert('Error', 'Failed to process invitation. Please try again.', [{ text: 'OK' }]);
      }
    } else {
      // Not logged in, store the token and redirect to login
      const { persistInvitation } = useTripStore.getState();
      await persistInvitation(token);
      router.replace('/(auth)/login');
    }
    return;
  }

  // Handle other notification types - navigate to notifications tab
  if (data?.type) {
    console.log('[NOTIFICATION] Unknown notification type, navigating to notifications tab');
    logger.debug('NOTIFICATION', 'Navigating to notifications for type', { type: data.type });
    router.push('/(tabs)/notifications');
  } else {
    console.log('[NOTIFICATION] No type in notification data, ignoring');
  }
}

// Configure how notifications are presented when the app is in the foreground
export function configureNotifications() {
  console.log('[NOTIFICATION] configureNotifications called');

  // Android-specific channel creation
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Handle cold start - check if app was opened from a notification tap
  // This catches the case when app is killed and user taps notification
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) {
        console.log('[NOTIFICATION] ===== COLD START NOTIFICATION DETECTED =====');
        console.log(
          '[NOTIFICATION] Last notification response:',
          JSON.stringify(response, null, 2)
        );
        handleNotificationResponse(response);
      } else {
        console.log('[NOTIFICATION] No pending notification response on cold start');
      }
    })
    .catch((error) => {
      console.log('[NOTIFICATION] Error checking last notification response:', error);
    });

  // Handle notification taps (warm start - app already running)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    async (response) => {
      console.log('[NOTIFICATION] ===== NOTIFICATION TAP RECEIVED (WARM START) =====');
      console.log('[NOTIFICATION] Full response:', JSON.stringify(response, null, 2));
      await handleNotificationResponse(response);
    }
  );

  // Handle notifications received while app is running
  const notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log(
      '[NOTIFICATION] Notification received while app is running:',
      notification.request.content.title
    );
    // You can handle foreground notifications here if needed
    // For example, play a sound or show an in-app banner
    logger.debug('NOTIFICATION', 'Foreground notification received:', notification.request.content.title);
  });

  // Return cleanup function (for use with useEffect if needed)
  return () => {
    responseSubscription.remove();
    notificationSubscription.remove();
  };
}

/**
 * Show a local notification (useful for testing)
 * No-op on simulators/emulators
 */
export async function showLocalNotification(title: string, body: string, data?: NotificationData) {
  // Skip if notifications module not loaded (simulator/emulator)
  if (!Notifications) {
    logger.debug('NOTIFICATION', `Local notification skipped (no module): ${title}`);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // null means show immediately
  });
}
