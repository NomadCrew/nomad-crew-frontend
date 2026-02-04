import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { logger } from '@/src/utils/logger';
import Constants from 'expo-constants';

/**
 * Service for managing push notifications with Expo and the backend.
 *
 * Flow:
 * 1. Request permissions from the user
 * 2. Get the Expo push token from Expo's servers
 * 3. Register the token with our backend
 * 4. Backend stores token and uses it to send notifications via Expo Push API
 */

/**
 * Check if running on a physical device (push notifications only work on devices)
 */
function isPhysicalDevice(): boolean {
  // In development, Constants.isDevice tells us if it's a physical device
  // In production builds, we assume physical device
  return Constants.isDevice ?? true;
}

export interface PushToken {
  id: string;
  userId: string;
  token: string;
  deviceType: 'ios' | 'android';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

interface RegisterPushTokenResponse {
  id: string;
  userId: string;
  token: string;
  deviceType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

/**
 * Request push notification permissions from the user
 * @returns true if permissions were granted
 */
export async function requestPushNotificationPermissions(): Promise<boolean> {
  // Push notifications only work on physical devices
  if (!isPhysicalDevice()) {
    logger.warn('PUSH_NOTIFICATIONS', 'Push notifications only work on physical devices');
    return false;
  }

  // Check current permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    logger.info('PUSH_NOTIFICATIONS', 'Push notification permissions denied');
    return false;
  }

  logger.info('PUSH_NOTIFICATIONS', 'Push notification permissions granted');
  return true;
}

/**
 * Get the Expo push token for this device
 * @returns The Expo push token string, or null if unavailable
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Get project ID from expo-constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      logger.warn('PUSH_NOTIFICATIONS', 'No EAS project ID found in app config');
      // For development, we can still try to get the token
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    logger.debug('PUSH_NOTIFICATIONS', 'Got Expo push token', {
      token: tokenData.data.substring(0, 20) + '...',
    });

    return tokenData.data;
  } catch (error) {
    logger.error('PUSH_NOTIFICATIONS', 'Failed to get Expo push token', error);
    return null;
  }
}

/**
 * Register the push token with the backend
 * @param token The Expo push token
 * @returns The registered token data from the backend
 */
export async function registerPushTokenWithBackend(token: string): Promise<PushToken | null> {
  try {
    const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';

    const response = await api.post<RegisterPushTokenResponse>(API_PATHS.pushTokens.register, {
      token,
      deviceType,
    });

    logger.info('PUSH_NOTIFICATIONS', 'Push token registered with backend', {
      tokenId: response.data.id,
      deviceType: response.data.deviceType,
    });

    return {
      ...response.data,
      deviceType: response.data.deviceType as 'ios' | 'android',
    };
  } catch (error) {
    logger.error('PUSH_NOTIFICATIONS', 'Failed to register push token with backend', error);
    return null;
  }
}

/**
 * Deregister the push token from the backend (e.g., on logout)
 * @param token The Expo push token to deregister
 */
export async function deregisterPushTokenFromBackend(token: string): Promise<boolean> {
  try {
    await api.delete(API_PATHS.pushTokens.deregister, {
      data: { token },
    });

    logger.info('PUSH_NOTIFICATIONS', 'Push token deregistered from backend');
    return true;
  } catch (error) {
    logger.error('PUSH_NOTIFICATIONS', 'Failed to deregister push token from backend', error);
    return false;
  }
}

/**
 * Deregister all push tokens for the current user from the backend
 * (e.g., on "logout from all devices")
 */
export async function deregisterAllPushTokensFromBackend(): Promise<boolean> {
  try {
    await api.delete(API_PATHS.pushTokens.deregisterAll);

    logger.info('PUSH_NOTIFICATIONS', 'All push tokens deregistered from backend');
    return true;
  } catch (error) {
    logger.error('PUSH_NOTIFICATIONS', 'Failed to deregister all push tokens from backend', error);
    return false;
  }
}

/**
 * Complete push notification setup:
 * 1. Request permissions
 * 2. Get Expo push token
 * 3. Register with backend
 *
 * Call this after user authentication is complete.
 * @returns The registered push token, or null if setup failed
 */
export async function setupPushNotifications(): Promise<PushToken | null> {
  logger.info('PUSH_NOTIFICATIONS', 'Starting push notification setup');

  // Step 1: Request permissions
  const hasPermission = await requestPushNotificationPermissions();
  if (!hasPermission) {
    logger.warn('PUSH_NOTIFICATIONS', 'Push notification setup aborted: no permissions');
    return null;
  }

  // Step 2: Get Expo push token
  const expoPushToken = await getExpoPushToken();
  if (!expoPushToken) {
    logger.warn('PUSH_NOTIFICATIONS', 'Push notification setup aborted: no token');
    return null;
  }

  // Step 3: Register with backend
  const registeredToken = await registerPushTokenWithBackend(expoPushToken);
  if (!registeredToken) {
    logger.warn(
      'PUSH_NOTIFICATIONS',
      'Push notification setup aborted: backend registration failed'
    );
    return null;
  }

  logger.info('PUSH_NOTIFICATIONS', 'Push notification setup complete');
  return registeredToken;
}

/**
 * Cleanup push notifications on logout:
 * Deregisters the current device's push token from the backend.
 */
export async function cleanupPushNotificationsOnLogout(): Promise<void> {
  logger.info('PUSH_NOTIFICATIONS', 'Cleaning up push notifications on logout');

  const expoPushToken = await getExpoPushToken();
  if (expoPushToken) {
    await deregisterPushTokenFromBackend(expoPushToken);
  }
}
