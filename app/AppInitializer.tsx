import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import { useAuthStore } from '@/src/store/useAuthStore';

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

  if (!fontsLoaded || fontError) {
    console.log('Waiting for fonts or initialization');
    return null;
  }

  return <>{children}</>;
}
