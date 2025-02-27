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

    // Parse the URL
    const parsedUrl = Linking.parse(url);
    
    let token = null;

    // Case 1: Custom scheme with token in query params
    if (parsedUrl.hostname === 'invite' && parsedUrl.path === 'accept' && parsedUrl.queryParams?.token) {
      token = parsedUrl.queryParams.token;
    } 
    // Case 2: Custom scheme with token in path
    else if (parsedUrl.hostname === 'invite' && parsedUrl.path?.startsWith('accept/')) {
      token = parsedUrl.path.replace('accept/', '');
    }
    // Case 3: Web URL with token in path
    else if (url.includes('/invite/accept/')) {
      token = url.split('/invite/accept/').pop();
    }
    // Case 4: Web URL with different format
    else if (parsedUrl.hostname === 'nomadcrew.uk' && parsedUrl.path?.includes('/invite/accept')) {
      // Try to extract token from the end of the path
      const pathParts = parsedUrl.path.split('/');
      token = pathParts[pathParts.length - 1];
    }

    if (token) {
      router.replace({
        pathname: "/invitation",
        params: { token }
      });
    }
  };

  if (!fontsLoaded || fontError) {
    return null;
  }

  return <>{children}</>;
}
