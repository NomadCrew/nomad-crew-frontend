// AppInitializer.tsx
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/features/auth/store'; // Adjusted path

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const { initialize: initializeAuth } = useAuthStore(); // Get initialize from store
  const [fontsLoaded, fontError] = useFonts({ /* ... */ });

  useEffect(() => {
    const initApp = async () => {
      if (fontsLoaded) { // <--- Condition
        await initializeAuth(); // Call initialize from store
        await SplashScreen.hideAsync(); // Use imported SplashScreen
        // Children are rendered regardless of this effect,
        // but this effect controls when the app is truly "ready"
      }
    };

    if (fontsLoaded) {
      initApp();
    }
  }, [fontsLoaded, initializeAuth]); // Add initializeAuth to dependency array

  // ... (deep link and notification logic) ...

  if (!fontsLoaded && !fontError) { // Or if fontError, show error
    // Potentially return null or a loading indicator here
    // If nothing is returned, children might render immediately
    // or be subject to the parent's rendering logic.
    // The provided snippet doesn't explicitly show a return here
    // for the !fontsLoaded case.
    // However, typical use of expo-splash-screen with useFonts
    // involves returning null or a minimal view until fonts are loaded.
    return null; // Let's assume this is the implicit or actual behavior
  }

  // If fontError, an error UI should be shown (not detailed here)
  if (fontError) {
     // return <Text>Error loading fonts</Text>; (Example)
     return null; // For simplicity of analysis
  }
  
  // Only if fontsLoaded (and no error) are children rendered.
  return children;
}