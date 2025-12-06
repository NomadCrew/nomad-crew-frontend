import React, { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/features/auth/store';
import { Text, View, ActivityIndicator } from 'react-native';
import { logger } from '../src/utils/logger';
import { useOnboarding } from '../src/providers/OnboardingProvider';

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

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const { initialize: initializeAuth, isInitialized: authInitialized } = useAuthStore();
  const { isInitialized: onboardingInitialized } = useOnboarding();
  const [fontsLoaded, fontError] = useFonts(customFonts);
  const [splashHidden, setSplashHidden] = useState(false);

  // Initialize auth when component mounts
  useEffect(() => {
    logger.debug('APP', 'AppInitializer mounted, triggering auth initialization');
    initializeAuth();
  }, [initializeAuth]);

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
