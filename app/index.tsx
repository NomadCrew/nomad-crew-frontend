import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isFirstTime, isInitialized } = useOnboarding();
  
  // Log state for debugging
  useEffect(() => {
    console.log('[Index] Initial render - isFirstTime:', isFirstTime, 'isInitialized:', isInitialized);
  }, []);
  
  // While initializing, show a loading spinner
  if (!isInitialized) {
    console.log('[Index] Not initialized yet, showing loading spinner');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff6600" />
      </View>
    );
  }
  
  // If onboarding is initialized and user is first time, redirect to onboarding flow
  if (isInitialized && isFirstTime) {
    console.log('[Index] Redirecting to (onboarding)/welcome because isFirstTime is true');
    return <Redirect href="/(onboarding)/welcome" />;
  }
  
  // If onboarding is initialized and user is not first time, redirect to tabs
  if (isInitialized && !isFirstTime) {
    console.log('[Index] Redirecting to (tabs) because isFirstTime is false');
    return <Redirect href="/(tabs)/trips" />;
  }

  // This should never be reached, but just in case
  console.log('[Index] Fallback case reached, this should not happen');
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#ff6600" />
    </View>
  );
}