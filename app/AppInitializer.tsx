import React, { useEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/features/auth/store';
import { Text, View, ActivityIndicator } from 'react-native';
import { logger } from '../src/utils/logger';
import { useOnboarding } from '../src/providers/OnboardingProvider';
import {
  configureNotifications,
  getPendingNotificationNavigation,
  setAppInitialized,
} from '../src/features/notifications/utils/notifications';
import { setupPushNotifications } from '../src/features/notifications/services/pushNotificationService';
import { router, useRootNavigationState } from 'expo-router';
import { setupNotificationServiceListener } from '@/src/features/notifications/service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_INVITATION_ID_KEY = '@pending_invitation_id';

// NOTE: SplashScreen.preventAutoHideAsync() is called in _layout.tsx at global scope
// This is the correct pattern per Expo documentation

// Define the font map
const customFonts = {
  'Manrope-Bold': require('../assets/fonts/Manrope/static/Manrope-Bold.ttf'),
  'Manrope-ExtraBold': require('../assets/fonts/Manrope/static/Manrope-ExtraBold.ttf'),
  'Manrope-ExtraLight': require('../assets/fonts/Manrope/static/Manrope-ExtraLight.ttf'),
  'Manrope-Light': require('../assets/fonts/Manrope/static/Manrope-Light.ttf'),
  'Manrope-Medium': require('../assets/fonts/Manrope/static/Manrope-Medium.ttf'),
  'Manrope-Regular': require('../assets/fonts/Manrope/static/Manrope-Regular.ttf'),
  'Manrope-SemiBold': require('../assets/fonts/Manrope/static/Manrope-SemiBold.ttf'),
  'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
};

/**
 * Coordinates app startup and renders children when initialization completes.
 *
 * Performs font loading, authentication and onboarding initialization, notification configuration,
 * push notification registration, and splash screen control. While resources are pending it
 * displays a branded loading UI; on font load failure it shows an error view.
 *
 * @param children - App content to render after startup is complete (typically the app's routes)
 * @returns The rendered application content once all initialization steps have finished
 */
export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const { initialize: initializeAuth, isInitialized: authInitialized, status } = useAuthStore();
  const isAuthenticated = status === 'authenticated';
  const { isInitialized: onboardingInitialized } = useOnboarding();
  const rootNavigationState = useRootNavigationState();
  const [fontsLoaded, fontError] = useFonts(customFonts);
  const [splashHidden, setSplashHidden] = useState(false);
  const [notificationsConfigured, setNotificationsConfigured] = useState(false);
  const notificationServiceInitRef = useRef(false);

  // Initialize auth when component mounts
  useEffect(() => {
    logger.debug('APP', 'AppInitializer mounted, triggering auth initialization');
    initializeAuth();
  }, [initializeAuth]);

  // Configure notifications once on app start (sets up handlers and Android channel)
  useEffect(() => {
    if (!notificationsConfigured) {
      logger.debug('APP', 'Configuring notifications...');
      configureNotifications();
      setNotificationsConfigured(true);
      logger.debug('APP', 'Notifications configured');
    }
  }, [notificationsConfigured]);

  // Setup push notifications after auth is initialized and user is authenticated
  // This registers the push token with the backend for session restore cases
  useEffect(() => {
    async function initPushNotifications() {
      if (authInitialized && isAuthenticated) {
        // Set up notification service listener (once)
        if (!notificationServiceInitRef.current) {
          setupNotificationServiceListener();
          notificationServiceInitRef.current = true;
        }

        logger.debug('APP', 'User authenticated, setting up push notifications...');
        try {
          const token = await setupPushNotifications();
          if (token) {
            logger.info('APP', 'Push notifications setup complete', { tokenId: token.id });
          } else {
            logger.debug('APP', 'Push notifications setup skipped (no token or permissions)');
          }
        } catch (error) {
          logger.error('APP', 'Failed to setup push notifications:', error);
        }
      }
    }

    initPushNotifications();
  }, [authInitialized, isAuthenticated]);

  // Hide splash screen when all resources are ready
  useEffect(() => {
    async function hideSplash() {
      // Wait for all initialization to complete
      if (!fontsLoaded) {
        logger.debug('APP', 'Waiting for fonts to load...');
        return;
      }
      if (!authInitialized) {
        logger.debug('APP', 'Waiting for auth to initialize...');
        return;
      }
      if (!onboardingInitialized) {
        logger.debug('APP', 'Waiting for onboarding to initialize...');
        return;
      }

      // All resources ready - hide splash screen
      logger.debug('APP', 'All resources ready, hiding splash screen');
      try {
        await SplashScreen.hideAsync();
        setSplashHidden(true);
        logger.debug('APP', 'Splash screen hidden successfully');
      } catch (error) {
        logger.error('APP', 'Error hiding splash screen:', error);
        setSplashHidden(true); // Still mark as hidden to proceed
      }
    }

    hideSplash();
  }, [fontsLoaded, authInitialized, onboardingInitialized]);

  // Apply pending notification navigation after app is fully ready
  // Uses useRootNavigationState to deterministically wait for router readiness
  // instead of a fragile setTimeout (which can fail on slow devices)
  useEffect(() => {
    if (!rootNavigationState?.key) {
      return;
    }

    if (splashHidden && authInitialized && isAuthenticated) {
      const pendingNav = getPendingNotificationNavigation();
      if (pendingNav) {
        logger.info('APP', 'Applying pending notification navigation', { path: pendingNav });
        router.push(pendingNav as any);
      } else {
        // Check AsyncStorage for a pending invitation ID (set when a notification
        // tap occurred while the user was not logged in)
        AsyncStorage.getItem(PENDING_INVITATION_ID_KEY)
          .then((pendingInvitationId) => {
            if (pendingInvitationId) {
              logger.info('APP', 'Found pending invitation ID in storage', {
                id: pendingInvitationId,
              });
              AsyncStorage.removeItem(PENDING_INVITATION_ID_KEY).catch(() => {});
              router.push(`/invitation/${pendingInvitationId}` as any);
            }
          })
          .catch((e) => {
            logger.error('APP', 'Failed to check pending invitation ID:', e);
          });
      }
      // Mark app as initialized so warm-start notification taps can navigate directly
      setAppInitialized();
    }
  }, [rootNavigationState?.key, splashHidden, authInitialized, isAuthenticated]);

  // Handle font loading error
  if (fontError) {
    logger.error('APP', 'Error loading fonts:', fontError);
    // Hide splash and show error
    SplashScreen.hideAsync().catch(console.warn);
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}
      >
        <Text style={{ color: '#333' }}>Error loading resources. Please restart the app.</Text>
      </View>
    );
  }

  // Show loading state while initializing
  // IMPORTANT: We render the loading state with a background color to avoid blank screen
  if (!fontsLoaded || !authInitialized || !onboardingInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFE8DC',
        }}
      >
        <ActivityIndicator size="large" color="#F46315" />
        <Text style={{ marginTop: 16, color: '#333', fontWeight: '500' }}>
          Loading NomadCrew...
        </Text>
      </View>
    );
  }

  // All resources loaded - render children
  // The children include <Slot /> which renders the appropriate route
  // Auth redirects happen in nested layouts, not here
  logger.debug('APP', 'App is ready, rendering children');
  return <>{children}</>;
}
