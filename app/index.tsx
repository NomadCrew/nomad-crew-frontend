import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the main app entry point
  return <Redirect href="/(tabs)/trips" />;
}