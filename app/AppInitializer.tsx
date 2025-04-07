import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useAuthStore } from '@/src/store/useAuthStore';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { configureNotifications } from '@/src/utils/notifications';
import { logger } from '@/src/utils/logger';
import { useTripStore } from '@/src/store/useTripStore';
import { jwtDecode } from 'jwt-decode';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define token interface
interface InvitationToken {
  tripId?: string;
  inviteeEmail?: string;
  invitationId?: string;
  exp?: number;
}

// Keep the splash screen visible while we fetch resources
ExpoSplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const { initialize, user, registerPushToken } = useAuthStore();

  const [fontsLoaded, fontError] = useFonts({
    'Inter': require('../assets/fonts/Inter/Inter-VariableFont_opsz,wght.ttf'),
    'Inter-Italic': require('../assets/fonts/Inter/Inter-Italic-VariableFont_opsz,wght.ttf'),
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Manrope': require('../assets/fonts/Manrope/Manrope-VariableFont_wght.ttf'),
  });

  useEffect(() => {
    const initApp = async () => {
      if (fontsLoaded) {
        await initialize();
        // Hide both splash screens to ensure proper transition
        await ExpoSplashScreen.hideAsync();
        await SplashScreen.hideAsync();
      }
    };

    if (fontsLoaded) {
      initApp();
    }
  }, [fontsLoaded, initialize]);

  // Handle deep links
  useEffect(() => {
    // Handle deep links when the app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle deep links when the app is opened from a link
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        logger.debug('DEEPLINK', `Initial URL detected: ${initialUrl}`);
        handleDeepLink({ url: initialUrl });
      }
    };

    getInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Configure notifications
    configureNotifications();

    // Register push token when user logs in
    if (user) {
      registerPushToken();
    }
  }, [user]);

  const handleDeepLink = async (event: { url: string }) => {
    const { url } = event;
    logger.debug('DEEPLINK', `Processing URL: ${url}`);
    logger.debug('DEEPLINK', `Current auth state: ${user ? 'Logged in as ' + user.email : 'Not logged in'}`);

    // Parse the URL
    const parsedUrl = Linking.parse(url);
    logger.debug('DEEPLINK', `Parsed URL:`, parsedUrl);
    
    let token = null;

    // Case 1: Custom scheme with token in query params
    if (parsedUrl.hostname === 'invite' && parsedUrl.path === 'accept' && parsedUrl.queryParams?.token) {
      token = parsedUrl.queryParams.token;
      logger.debug('DEEPLINK', 'Case 1: Token from query params');
    } 
    // Case 2: Custom scheme with token in path
    else if (parsedUrl.hostname === 'invite' && parsedUrl.path?.startsWith('accept/')) {
      token = parsedUrl.path.replace('accept/', '');
      logger.debug('DEEPLINK', 'Case 2: Token from path');
    }
    // Case 3: Web URL with token in path
    else if (url.includes('/invite/accept/')) {
      token = url.split('/invite/accept/').pop();
      logger.debug('DEEPLINK', 'Case 3: Token from web URL path');
    }
    // Case 4: Web URL with different format
    else if (parsedUrl.hostname === 'nomadcrew.uk' && parsedUrl.path?.includes('/invite/accept')) {
      // Try to extract token from the end of the path
      const pathParts = parsedUrl.path.split('/');
      token = pathParts[pathParts.length - 1];
      logger.debug('DEEPLINK', 'Case 4: Token from nomadcrew.uk path');
    }

    if (token) {
      logger.debug('DEEPLINK', `Token extracted: ${token.substring(0, 15)}...`);

      // If user is logged in, process invitation directly
      if (user) {
        try {
          // Verify the token is valid and matches the logged-in user
          let isValid = true;
          let errorMessage = '';
          
          try {
            const decodedToken: InvitationToken = jwtDecode(token);
            logger.debug('DEEPLINK', 'Decoded token:', decodedToken);
            
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
            logger.error('DEEPLINK', 'Error decoding token:', error);
          }
          
          if (isValid) {
            logger.debug('DEEPLINK', 'Processing invitation for logged-in user');
            // Refresh the auth session first
            if (user) {
              try {
                logger.debug('DEEPLINK', 'Refreshing auth session before accepting invitation');
                await useAuthStore.getState().refreshSession();
                
                // Log the auth token after refresh
                const authToken = useAuthStore.getState().token;
                logger.debug('DEEPLINK', `Auth token after refresh: ${authToken ? authToken.substring(0, 15) + '...' : 'Not available'}`);
                
                await useTripStore.getState().acceptInvitation(token);
                
                // Navigate to trips page
                router.replace('/(tabs)/trips');
                
                // Show success message
                Alert.alert(
                  'Invitation Accepted',
                  'You have been added to the trip successfully!',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                logger.error('DEEPLINK', 'Error accepting invitation:', error);
                Alert.alert(
                  'Error',
                  'Failed to accept invitation. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } else {
              // Not logged in, redirect to the invitation screen
              try {
                logger.debug('DEEPLINK', 'Redirecting to invitation screen');
                router.replace({
                  pathname: "/(auth)/invitation",
                  params: { token }
                });
              } catch (navError) {
                logger.error('DEEPLINK', 'Navigation error:', navError);
                // Fallback to storing token and redirecting to login
                await AsyncStorage.setItem('pendingInvitation', token);
                router.replace('/(auth)/login');
              }
            }
          } else {
            // Show error
            Alert.alert(
              'Invitation Error',
              errorMessage,
              [{ text: 'OK' }]
            );
          }
        } catch (error) {
          logger.error('DEEPLINK', 'Error processing invitation:', error);
          Alert.alert(
            'Error',
            'Failed to process invitation. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // Not logged in, store the token and redirect to login
        const { persistInvitation } = useTripStore.getState();
        persistInvitation(token);
        router.replace('/(auth)/login');
      }
    } else {
      logger.debug('DEEPLINK', 'No token extracted from URL');
    }
  };

  // Show children only if fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return children;
}
