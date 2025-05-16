import { useLocalSearchParams, router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { logger } from '@/src/utils/logger';

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
      
      // Try direct navigation to the auth invitation screen
      try {
        logger.debug('INVITE', `Redirecting to invitation screen with token: ${token.substring(0, 15)}...`);
        router.replace({
          pathname: "/(auth)/invitation",
          params: { token }
        });
      } catch (error) {
        logger.error('INVITE', 'Navigation error:', error);
        // Fallback to the root path with params if direct navigation fails
        router.replace({
          pathname: "/",
          params: { screen: "invitation", token }
        });
      }
    }
  }, [id]);

  // Show a loading indicator while redirecting
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </ThemedView>
  );
}
