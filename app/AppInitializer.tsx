import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import { useAuthStore } from '@/src/store/useAuthStore';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuthStore();

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
        handleDeepLink({ url: initialUrl });
      }
    };

    getInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (event: { url: string }) => {
    const { url } = event;
    console.log('Deep link received:', url);

    // Parse the URL
    const parsedUrl = Linking.parse(url);
    console.log('Parsed URL:', parsedUrl);
    
    // Add more detailed logging
    console.log('Deep link details:', {
      fullUrl: url,
      scheme: parsedUrl.scheme,
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      queryParams: parsedUrl.queryParams,
    });

    let token = null;

    // Case 1: Custom scheme with token in query params
    if (parsedUrl.hostname === 'invite' && parsedUrl.path === 'accept' && parsedUrl.queryParams?.token) {
      token = parsedUrl.queryParams.token;
      console.log('Case 1: Token from query params:', token);
    } 
    // Case 2: Custom scheme with token in path
    else if (parsedUrl.hostname === 'invite' && parsedUrl.path?.startsWith('accept/')) {
      token = parsedUrl.path.replace('accept/', '');
      console.log('Case 2: Token from path segment:', token);
    }
    // Case 3: Web URL with token in path
    else if (url.includes('/invite/accept/')) {
      token = url.split('/invite/accept/').pop();
      console.log('Case 3: Token from web URL path:', token);
    }
    // Case 4: Web URL with different format
    else if (parsedUrl.hostname === 'nomadcrew.uk' && parsedUrl.path?.includes('/invite/accept')) {
      // Try to extract token from the end of the path
      const pathParts = parsedUrl.path.split('/');
      token = pathParts[pathParts.length - 1];
      console.log('Case 4: Token from web URL path parts:', token);
    }

    if (token) {
      console.log('Navigating to invitation screen with token:', token);
      router.replace({
        pathname: "/invitation",
        params: { token }
      });
    } else {
      console.log('Unhandled deep link format or no token found');
    }
  };

  if (!fontsLoaded || fontError) {
    console.log('Waiting for fonts or initialization');
    return null;
  }

  return <>{children}</>;
}
