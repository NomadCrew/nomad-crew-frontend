/**
 * Simulator Auth Bypass
 *
 * This module provides a way to bypass authentication when running in a simulator
 * during development. This is useful for testing the app without needing to
 * authenticate through real OAuth providers (which don't work in simulators).
 *
 * SECURITY: This is only enabled when:
 * - __DEV__ is true (development mode)
 * - Running on iOS Simulator or Android Emulator (detected via expo-device)
 *
 * On physical devices (including EAS development builds), this bypass is disabled.
 */

import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { logger } from './logger';
import type { User } from '@/src/features/auth/types';

// Check if running in a simulator/emulator using expo-device (reliable method)
const isSimulator = (): boolean => {
  // Device.isDevice is the Expo-recommended way to detect simulators:
  // - true = physical device
  // - false = simulator/emulator
  const isPhysicalDevice = Device.isDevice;

  // Log for debugging
  logger.debug('SIMULATOR-AUTH', 'Device detection', {
    isDevice: isPhysicalDevice,
    osName: Device.osName,
    modelName: Device.modelName,
    platform: Platform.OS,
  });

  // Device.isDevice is reliable:
  // - Returns true for physical devices
  // - Returns false for simulators/emulators
  if (isPhysicalDevice) {
    logger.debug('SIMULATOR-AUTH', 'Device.isDevice=true, treating as physical device');
    return false;
  }

  // isDevice is false = simulator/emulator
  logger.debug('SIMULATOR-AUTH', 'Device.isDevice=false, treating as simulator');
  return true;
};

// Determine if simulator auth bypass should be enabled
export const shouldBypassAuth = (): boolean => {
  const bypass = __DEV__ && isSimulator();
  if (bypass) {
    logger.warn(
      'SIMULATOR-AUTH',
      '⚠️ Simulator auth bypass is ENABLED - do not use in production!'
    );
  }
  return bypass;
};

// Mock user for simulator testing
// Using a valid UUID format for database compatibility
export const MOCK_SIMULATOR_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'simulator@dev.nomadcrew.local',
  username: 'SimulatorDev',
  firstName: 'Simulator',
  lastName: 'Developer',
  profilePicture: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  appleUser: false,
};

// Mock JWT token for simulator
// This is a properly formatted (but unsigned) JWT that the backend's simulator bypass recognizes
// Format: header.payload.signature (base64url encoded)
// The backend checks for MOCK_SIMULATOR_USER_ID in development mode
// Header: {"alg":"none","typ":"JWT"}
// Payload: {"sub":"00000000-0000-0000-0000-000000000001","exp":9999999999}
export const MOCK_SIMULATOR_TOKEN =
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJleHAiOjk5OTk5OTk5OTl9.';

// Mock refresh token
export const MOCK_SIMULATOR_REFRESH_TOKEN = 'simulator-dev-refresh-token';

/**
 * Get simulator auth state if bypass is enabled
 * Returns null if bypass is not enabled
 */
export const getSimulatorAuthState = (): {
  user: User;
  token: string;
  refreshToken: string;
} | null => {
  if (!shouldBypassAuth()) {
    return null;
  }

  logger.info('SIMULATOR-AUTH', 'Providing mock auth state for simulator development');

  return {
    user: MOCK_SIMULATOR_USER,
    token: MOCK_SIMULATOR_TOKEN,
    refreshToken: MOCK_SIMULATOR_REFRESH_TOKEN,
  };
};
