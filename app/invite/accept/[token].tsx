import { useLocalSearchParams, router, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { logger } from '@/src/utils/logger';

/**
 * Deep link handler for invitation acceptance URLs.
 *
 * This route captures URLs like: nomadcrew://invite/accept/TOKEN
 * and redirects to the invitation handling screen.
 */
export default function InviteAcceptRedirect() {
  const { token } = useLocalSearchParams();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // Wait for navigation to be ready before redirecting
    if (!rootNavigationState?.key) {
      return;
    }

    if (typeof token === 'string') {
      logger.debug(
        'INVITE',
        `Redirecting to invitation screen with token: ${token.substring(0, 15)}...`
      );
      router.replace({
        pathname: '/(auth)/invitation',
        params: { token },
      });
    }
  }, [token, rootNavigationState?.key]);

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </ThemedView>
  );
}
