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
  messageId?: string;
  invitationId?: string;
  senderId?: string;
  url?: string;
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
 * Initialize notifications module - call this early in app startup
 * Only loads expo-notifications on physical devices to avoid Keychain errors on simulators
 */
export async function initializeNotifications(): Promise<boolean> {
  if (!isPhysicalDevice()) {
    logger.debug('NOTIFICATION', 'Skipping notification initialization: not a physical device (simulator/emulator)');
    return false;
  }

  try {
    // Dynamic import - only loads on physical devices
    Notifications = await import('expo-notifications');

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    logger.debug('NOTIFICATION', 'Notification module initialized successfully');
    return true;
  } catch (error) {
    logger.error('NOTIFICATION', 'Failed to initialize notifications:', error);
    return false;
  }
}

/**
 * Configure notification listeners for the app
 * Must be called after initializeNotifications()
 */
export function configureNotifications() {
  // Skip if notifications module not loaded (simulator/emulator)
  if (!Notifications) {
    logger.debug('NOTIFICATION', 'Skipping notification configuration: module not loaded');
    return;
  }

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
      const token = data.token as string;
      logger.debug('NOTIFICATION', `Processing invitation token: ${token.substring(0, 15)}...`);

      const { user } = useAuthStore.getState();

      // If user is logged in, process invitation directly
      if (user) {
        try {
          // Verify the token is valid and matches the logged-in user
          let isValid = true;
          let errorMessage = '';

          try {
            const decodedToken: InvitationToken = jwtDecode(token);
            logger.debug('NOTIFICATION', 'Decoded token:', decodedToken);

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
    logger.debug('NOTIFICATION', 'Foreground notification received:', notification.request.content.title);
  });

  logger.debug('NOTIFICATION', 'Notification listeners configured');
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

/**
 * Check if notifications are available (physical device with module loaded)
 */
export function areNotificationsAvailable(): boolean {
  return Notifications !== null;
}
