import React, { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/src/features/auth/store';
import { ThemedView } from '@/components/ThemedView';
import { tripApi } from '@/src/features/trips/api';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { InvitationDetails, InvitationError } from '@/src/features/trips/types';
import { InvitationPreview } from '@/src/features/trips/components/InvitationPreview';
import { getErrorFromResponse } from '@/src/features/trips/utils/invitationErrors';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { logger } from '@/src/utils/logger';

const PENDING_INVITATION_ID_KEY = '@pending_invitation_id';

/**
 * Display and manage an invitation identified by its UUID.
 *
 * Fetches invitation details via the ID-based endpoint, validates the current user's access,
 * and presents accept/decline flows. If no user is signed in the invitationId is stored
 * for later and the user is redirected to login.
 */
export default function InvitationByIdScreen() {
  const { invitationId } = useLocalSearchParams();
  const { user, signOut } = useAuthStore();
  const theme = useAppTheme().theme;

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<InvitationError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const fetchInvitationDetails = useCallback(async () => {
    setInvitation(null);
    setError(null);
    setIsLoading(true);

    logger.debug(
      'INVITATION',
      `Fetching by ID: ${typeof invitationId === 'string' ? invitationId.substring(0, 8) + '...' : 'none'}`
    );
    logger.debug(
      'INVITATION',
      `Auth state: ${user ? 'Logged in as ' + user.email : 'Not logged in'}`
    );

    if (!invitationId || typeof invitationId !== 'string') {
      setError({
        title: 'Invalid Link',
        message: 'No invitation ID was provided. Please check the link and try again.',
      });
      setIsLoading(false);
      return;
    }

    // If user is not logged in, store invitationId and redirect to login
    if (!user) {
      logger.debug('INVITATION', 'No user logged in, storing invitation ID for later');
      try {
        await AsyncStorage.setItem(PENDING_INVITATION_ID_KEY, invitationId);
      } catch (storageError) {
        logger.error('INVITATION', 'Failed to persist invitation ID:', storageError);
        Alert.alert(
          'Storage Error',
          'Unable to save invitation. Please try the link again after logging in.'
        );
      }
      router.replace('/(auth)/login');
      return;
    }

    try {
      logger.debug('INVITATION', 'Fetching invitation details by ID...');
      const details = await tripApi.getInvitationById(invitationId);
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

      // Check email match
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

      // Clear the pending invitation ID now that it has been loaded successfully
      AsyncStorage.removeItem(PENDING_INVITATION_ID_KEY).catch((e) =>
        logger.error('INVITATION', 'Failed to clear pending invitation ID:', e)
      );
    } catch (err) {
      logger.error('INVITATION', 'Error fetching invitation details:', err);
      setError(getErrorFromResponse(err));
    } finally {
      setIsLoading(false);
    }
  }, [invitationId, user]);

  useEffect(() => {
    fetchInvitationDetails();
  }, [fetchInvitationDetails]);

  // Handle accept invitation (ID-based endpoint)
  const handleAccept = useCallback(async () => {
    if (!invitationId || typeof invitationId !== 'string') return;

    setIsAccepting(true);
    try {
      logger.debug('INVITATION', 'Accepting invitation by ID...');
      await api.post(API_PATHS.invitations.accept(invitationId));
      logger.debug('INVITATION', 'Invitation accepted successfully');

      router.replace('/(tabs)/trips');
    } catch (err) {
      logger.error('INVITATION', 'Error accepting invitation:', err);
      setError(getErrorFromResponse(err));
    } finally {
      setIsAccepting(false);
    }
  }, [invitationId]);

  // Handle decline invitation (ID-based endpoint)
  const handleDecline = useCallback(async () => {
    if (!invitationId || typeof invitationId !== 'string') return;

    setIsDeclining(true);
    try {
      logger.debug('INVITATION', 'Declining invitation by ID...');
      await api.post(API_PATHS.invitations.decline(invitationId));
      logger.debug('INVITATION', 'Invitation declined successfully');

      router.replace('/(tabs)' as never);
    } catch (err) {
      logger.error('INVITATION', 'Error declining invitation:', err);
      setError(getErrorFromResponse(err));
    } finally {
      setIsDeclining(false);
    }
  }, [invitationId]);

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
        setError(null);
        setIsLoading(true);
        fetchInvitationDetails();
        break;
    }
  }, [error, invitationId, signOut, fetchInvitationDetails]);

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
