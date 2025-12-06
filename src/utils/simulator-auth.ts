/**
 * Simulator Auth Bypass
 *
 * This module provides a way to bypass authentication when running in a simulator
 * during development. This is useful for testing the app without needing to
 * authenticate through real OAuth providers (which don't work in simulators).
 *
 * SECURITY: This is only enabled when:
 * - __DEV__ is true (development mode)
 * - Running in iOS Simulator or Android Emulator
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { logger } from './logger';
import type { User } from '@/src/features/auth/types';

// Check if running in a simulator/emulator
const isSimulator = (): boolean => {
  if (Platform.OS === 'ios') {
    // In iOS simulator, isDevice is false
    return !Constants.isDevice;
  }
  if (Platform.OS === 'android') {
    // For Android, check if we're in an emulator
    // fingerprint containing 'generic' or 'emulator' indicates emulator
    return !Constants.isDevice;
  }
  return false;
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

// Mock JWT token for simulator (this is not a real JWT, just a placeholder)
// The backend will need to recognize this or have its own bypass for development
export const MOCK_SIMULATOR_TOKEN = 'simulator-dev-token-bypass';

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
