import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/features/auth/store';
import { Text, View, ActivityIndicator } from 'react-native';
import { logger } from '../src/utils/logger';

// Keep splash screen visible while resources are loading
SplashScreen.preventAutoHideAsync().catch(console.warn);

// Define the font map
const customFonts = {
  'Manrope-Bold': require('../assets/fonts/Manrope/static/Manrope-Bold.ttf'),
  'Manrope-ExtraBold': require('../assets/fonts/Manrope/static/Manrope-ExtraBold.ttf'),
  'Manrope-ExtraLight': require('../assets/fonts/Manrope/static/Manrope-ExtraLight.ttf'),
  'Manrope-Light': require('../assets/fonts/Manrope/static/Manrope-Light.ttf'),
  'Manrope-Medium': require('../assets/fonts/Manrope/static/Manrope-Medium.ttf'),
  'Manrope-Regular': require('../assets/fonts/Manrope/static/Manrope-Regular.ttf'),
  'Manrope-SemiBold': require('../assets/fonts/Manrope/static/Manrope-SemiBold.ttf'),
  'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'), // Assuming this is directly in assets/fonts/
};

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const { initialize: initializeAuth, isInitialized } = useAuthStore();
  const [appReady, setAppReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts(customFonts);

  useEffect(() => {
    async function prepare() {
      try {
        logger.debug('APP', 'Starting app preparation phase.');
        // Wait for fonts to load AND auth store to be initialized
        if (!fontsLoaded || !isInitialized) { 
          logger.debug('APP', `Waiting for resources: fontsLoaded=${String(fontsLoaded)}, authInitialized=${String(isInitialized)}`);
          return;
        }
        logger.debug('APP', 'Fonts loaded and auth store initialized.');

        // If auth is initialized but there was no explicit call to initializeAuth yet, 
        // (e.g. if isInitialized becomes true due to supabase.onAuthStateChange), 
        // we might not need to call it again. However, the current initializeAuth 
        // also sets isInitialized to true at the end.
        // For simplicity, we assume initializeAuth is idempotent or its first run handles everything needed
        // before app is truly "ready". The `isInitialized` flag from the store signals that
        // the store has attempted to load initial auth state.

        // Call initializeAuth if it hasn't been effectively run to completion.
        // The store's initialize sets `isInitialized` to true at the end.
        // If we are here and isInitialized is true, it implies the store did its initial loading.
        // No need to call initializeAuth() again if isInitialized is already true from the store itself.
        // The purpose of AppInitializer's own initializeAuth call is typically to kick off that process.

        // The crucial part is that `isInitialized` from the store must be true.
        // The store's `initialize` function is what sets `isInitialized` to true.
        // So, we call it here to ensure it runs. If it has run, `isInitialized` will be true.
        await initializeAuth(); // Ensure auth initialization logic within the store is triggered.
        logger.debug('APP', 'Auth initialization triggered/completed.');
        
        // Mark app as ready
        setAppReady(true);
        logger.debug('APP', 'App marked as ready.');
        
        // Hide splash screen AFTER app is ready and auth is initialized
        await SplashScreen.hideAsync();
        logger.debug('APP', 'Splash screen hidden');
        
      } catch (error) {
        logger.error('APP', 'Error during initialization:', error);
        // Even on error, we should hide the splash screen and render something
        await SplashScreen.hideAsync();
        setAppReady(true);
      }
    }

    prepare();
  }, [fontsLoaded, initializeAuth, isInitialized]);

  // Handle font loading error
  if (fontError) {
    logger.error('APP', 'Error loading fonts:', fontError);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error loading resources. Please restart the app.</Text>
      </View>
    );
  }
  
  // While app is not ready (fonts or auth), show loading or return null
  // It's crucial that SplashScreen.hideAsync() is called before returning anything here
  // or ensure this loading state is very brief.
  if (!appReady) {
    // Optionally, you can show a minimal loading indicator here if preferred
    // For now, returning null as before, but after splash screen logic in prepare()
    // logger.debug('APP', 'App not ready, returning null from AppInitializer render.');
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
            <Text>Loading...</Text>
        </View>
    );
  }
  
  logger.debug('APP', 'App is ready, rendering children.');
  // Render children when app is ready
  return children;
}