import React, { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native';
import { useAuthStore } from '@/src/features/auth/store';
import { ThemedView } from '@/components/ThemedView';
import { useTripStore } from '@/src/features/trips/store';
import { tripApi } from '@/src/features/trips/api';
import { InvitationDetails, InvitationError } from '@/src/features/trips/types';
import { InvitationPreview } from '@/src/features/trips/components/InvitationPreview';
import { getErrorFromResponse } from '@/src/features/trips/utils/invitationErrors';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { logger } from '@/src/utils/logger';
import { useQueryClient } from '@tanstack/react-query';
import { tripKeys } from '@/src/features/trips/queries';

/**
 * Display and manage an invitation identified by the route token.
 *
 * Fetches invitation details, validates the current user's access, and presents accept/decline flows.
 * If no user is signed in the token is stored for later and the user is redirected to login.
 * Errors are translated to user-facing messages with optional actions (navigate, retry, switch account).
 *
 * @returns A React element rendering the invitation screen
 */
export default function InvitationScreen() {
  const { token } = useLocalSearchParams();
  const { user, signOut } = useAuthStore();
  const theme = useAppTheme().theme;
  const queryClient = useQueryClient();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<InvitationError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  // Extract fetch logic as a reusable callback for both initial load and retry
  const fetchInvitationDetails = useCallback(async () => {
    // Clear previous state to prevent stale UI when token changes
    setInvitation(null);
    setError(null);
    setIsLoading(true);

    logger.debug(
      'INVITATION',
      `Fetching with token: ${typeof token === 'string' ? token.substring(0, 15) + '...' : 'none'}`
    );
    logger.debug(
      'INVITATION',
      `Auth state: ${user ? 'Logged in as ' + user.email : 'Not logged in'}`
    );

    if (!token || typeof token !== 'string') {
      setError({
        title: 'Invalid Link',
        message: 'No invitation token was provided. Please check the link and try again.',
      });
      setIsLoading(false);
      return;
    }

    // If user is not logged in, store token and redirect to login
    if (!user) {
      logger.debug('INVITATION', 'No user logged in, storing invitation for later');
      try {
        // Use store's persistInvitation to match checkPendingInvitations key format
        await useTripStore.getState().persistInvitation(token);
      } catch (storageError) {
        logger.error('INVITATION', 'Failed to persist invitation via store:', storageError);
        Alert.alert(
          'Storage Error',
          'Unable to save invitation. Please try the link again after logging in.'
        );
      }
      router.replace('/(auth)/login');
      return;
    }

    try {
      logger.debug('INVITATION', 'Fetching invitation details...');
      const details = await tripApi.getInvitationDetails(token);
      logger.debug('INVITATION', 'Invitation details received:', details);

      // Check if invitation is still pending
      if (details.status !== 'PENDING') {
        setError({
          title: details.status === 'ACCEPTED' ? 'Already Accepted' : 'Already Declined',
          message:
            details.status === 'ACCEPTED'
              ? 'You have already accepted this invitation.'
              : 'This invitation has already been declined.',
          action: details.status === 'ACCEPTED' ? 'go_to_trips' : undefined,
          tripId: details.tripId,
        });
        setIsLoading(false);
        return;
      }

      // Check email match (additional client-side validation)
      if (details.email && user.email && details.email.toLowerCase() !== user.email.toLowerCase()) {
        setError({
          title: 'Wrong Account',
          message: `This invitation was sent to ${details.email}, but you're logged in as ${user.email}.`,
          action: 'switch_account',
        });
        setIsLoading(false);
        return;
      }

      setInvitation(details);
    } catch (err) {
      logger.error('INVITATION', 'Error fetching invitation details:', err);
      setError(getErrorFromResponse(err));
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  // Fetch invitation details on mount and when dependencies change
  useEffect(() => {
    fetchInvitationDetails();
  }, [fetchInvitationDetails]);

  // Handle accept invitation
  const handleAccept = useCallback(async () => {
    if (!token || typeof token !== 'string') return;

    setIsAccepting(true);
    try {
      logger.debug('INVITATION', 'Accepting invitation...');
      await useTripStore.getState().acceptInvitation(token);
      logger.debug('INVITATION', 'Invitation accepted successfully');

      // Invalidate trips cache so the newly joined trip appears in the list
      await queryClient.invalidateQueries({ queryKey: tripKeys.lists() });

      // Navigate to trips list
      router.replace('/(tabs)/trips');
    } catch (err) {
      logger.error('INVITATION', 'Error accepting invitation:', err);
      setError(getErrorFromResponse(err));
    } finally {
      setIsAccepting(false);
    }
  }, [token, queryClient]);

  // Handle decline invitation
  const handleDecline = useCallback(async () => {
    if (!token || typeof token !== 'string') return;

    setIsDeclining(true);
    try {
      logger.debug('INVITATION', 'Declining invitation...');
      await useTripStore.getState().declineInvitation(token);
      logger.debug('INVITATION', 'Invitation declined successfully');

      // Navigate to home
      router.replace('/(tabs)' as never);
    } catch (err) {
      logger.error('INVITATION', 'Error declining invitation:', err);
      setError(getErrorFromResponse(err));
    } finally {
      setIsDeclining(false);
    }
  }, [token]);

  // Handle error action buttons
  const handleErrorAction = useCallback(() => {
    if (!error?.action) return;

    switch (error.action) {
      case 'go_to_trips':
        router.replace('/(tabs)/trips' as never);
        break;
      case 'switch_account':
        signOut();
        router.replace('/(auth)/login');
        break;
      case 'view_trip':
        if (error.tripId) {
          router.replace(`/(tabs)/trips/${error.tripId}` as never);
        } else {
          router.replace('/(tabs)/trips' as never);
        }
        break;
      case 'retry':
        // Reset error and directly re-fetch
        setError(null);
        setIsLoading(true);
        fetchInvitationDetails();
        break;
    }
  }, [error, token, signOut, fetchInvitationDetails]);

  // Show loading while checking auth or fetching
  if (isLoading && !invitation && !error) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <InvitationPreview
          invitation={invitation}
          error={error}
          isLoading={isLoading}
          isAccepting={isAccepting}
          isDeclining={isDeclining}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onAction={handleErrorAction}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
