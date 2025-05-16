// AppInitializer.tsx
export default function AppInitializer({ children }: { children: React.ReactNode }) {
  // ...
  const [fontsLoaded, fontError] = useFonts({ /* ... */ });

  useEffect(() => {
    const initApp = async () => {
      if (fontsLoaded) { // <--- Condition
        await initialize();
        await ExpoSplashScreen.hideAsync();
        await SplashScreen.hideAsync();
        // Children are rendered regardless of this effect,
        // but this effect controls when the app is truly "ready"
      }
    };

    if (fontsLoaded) {
      initApp();
    }
  }, [fontsLoaded, initialize]);

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