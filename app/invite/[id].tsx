import { useLocalSearchParams, router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';

export default function InviteRedirect() {
  const { id } = useLocalSearchParams();

  useEffect(() => {
    const extractToken = (rawId: string) => {
      // Handle both URL paths and raw tokens
      // Remove any trailing or leading slashes
      const token = rawId.split('/').pop() || rawId;
      return token.replace(/^\/+|\/+$/g, '');
    };

    if (typeof id === 'string') {
      const token = extractToken(id);
      console.log('Extracted invitation token:', token);
      
      // Redirect to the invitation screen with the token
      router.replace({
        pathname: "/invitation",
        params: { token }
      });
    }
  }, [id]);

  // Show a loading indicator while redirecting
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </ThemedView>
  );
}
