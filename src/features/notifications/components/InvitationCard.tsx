import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Avatar, Surface } from 'react-native-paper';
import { formatDistanceToNow } from 'date-fns';
import { UserPlus, Check, X } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { TripInvitationNotification } from '../types/notification';
import {
  useNotificationStore,
  selectIsNotificationActionInProgress,
} from '../store/useNotificationStore';
import { router } from 'expo-router';

interface InvitationCardProps {
  invitation: TripInvitationNotification;
  onAccept?: () => void;
  onDecline?: () => void;
}

/**
 * A polished card component for displaying trip invitations.
 * Features:
 * - Elevated card with accent border for pending invitations
 * - Avatar placeholder for inviter
 * - Accept/Decline action buttons
 * - Unread indicator via background tint
 * - Removes notification from store after action completes
 */
export const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  onAccept,
  onDecline,
}) => {
  const { theme } = useAppTheme();
  const { acceptTripInvitation, declineTripInvitation } = useNotificationStore();
  // A3: Per-notification loading check
  const isActionInProgress = useNotificationStore(
    selectIsNotificationActionInProgress(invitation.id)
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formattedTime = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true });
    } catch {
      return 'recently';
    }
  }, [invitation.createdAt]);

  // Get initials from inviter name
  const initials = useMemo(() => {
    const name = invitation.metadata.inviterName || 'User';
    const parts = name.split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [invitation.metadata.inviterName]);

  const handleAccept = async () => {
    if (onAccept) {
      onAccept();
      return;
    }
    setErrorMessage(null);
    await acceptTripInvitation(invitation);
    const storeState = useNotificationStore.getState();
    if (storeState.error) {
      setErrorMessage(storeState.error);
    } else {
      // A5: notification is removed from store by acceptTripInvitation; navigate to trip
      router.push(`/trip/${invitation.metadata.tripID}`);
    }
  };

  const handleDecline = async () => {
    if (onDecline) {
      onDecline();
      return;
    }
    setErrorMessage(null);
    await declineTripInvitation(invitation);
    const storeState = useNotificationStore.getState();
    if (storeState.error) {
      setErrorMessage(storeState.error);
    }
    // A5: notification is removed from store by declineTripInvitation on success
  };

  const themedStyles = useMemo(() => styles(theme), [theme]);

  return (
    <Surface
      style={[themedStyles.container, !invitation.read && themedStyles.unreadContainer]}
      elevation={2}
    >
      {/* Left accent border for pending invitations */}
      {!invitation.read && <View style={themedStyles.accentBorder} />}

      <View style={themedStyles.content}>
        {/* Header: Avatar + Inviter info */}
        <View style={themedStyles.header}>
          <Avatar.Text
            size={48}
            label={initials}
            style={themedStyles.avatar}
            labelStyle={themedStyles.avatarLabel}
          />
          <View style={themedStyles.headerText}>
            <Text variant="titleMedium" style={themedStyles.tripName} numberOfLines={1}>
              {invitation.metadata.tripName}
            </Text>
            <Text variant="bodyMedium" style={themedStyles.inviterText}>
              Invited by {invitation.metadata.inviterName}
            </Text>
          </View>
          <UserPlus size={20} color={theme.colors.primary.main} style={themedStyles.inviteIcon} />
        </View>

        {/* Message preview if available */}
        {invitation.message && (
          <Text variant="bodySmall" style={themedStyles.message} numberOfLines={2}>
            "{invitation.message}"
          </Text>
        )}

        {/* Footer: Timestamp + Action buttons or error */}
        <View style={themedStyles.footer}>
          <Text variant="labelSmall" style={themedStyles.timestamp}>
            {formattedTime}
          </Text>

          {errorMessage ? (
            <View style={themedStyles.errorContainer}>
              <Text variant="labelSmall" style={themedStyles.errorText} numberOfLines={1}>
                {errorMessage}
              </Text>
              <View style={themedStyles.actions}>
                <Button
                  mode="outlined"
                  onPress={handleDecline}
                  style={[themedStyles.declineButton, themedStyles.touchTarget]}
                  labelStyle={themedStyles.declineLabel}
                  loading={isActionInProgress}
                  disabled={isActionInProgress}
                >
                  Decline
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAccept}
                  style={[themedStyles.acceptButton, themedStyles.touchTarget]}
                  loading={isActionInProgress}
                  disabled={isActionInProgress}
                >
                  Retry Accept
                </Button>
              </View>
            </View>
          ) : (
            <View style={themedStyles.actions}>
              <Button
                mode="outlined"
                onPress={handleDecline}
                style={[themedStyles.declineButton, themedStyles.touchTarget]}
                labelStyle={themedStyles.declineLabel}
                loading={isActionInProgress}
                disabled={isActionInProgress}
              >
                Decline
              </Button>
              <Button
                mode="contained"
                onPress={handleAccept}
                style={[themedStyles.acceptButton, themedStyles.touchTarget]}
                loading={isActionInProgress}
                disabled={isActionInProgress}
              >
                Accept
              </Button>
            </View>
          )}
        </View>
      </View>
    </Surface>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      borderRadius: 12,
      marginBottom: theme.spacing.stack.sm,
      overflow: 'hidden',
      flexDirection: 'row',
      backgroundColor: theme.colors.surface.default,
    },
    unreadContainer: {
      backgroundColor: theme.colors.primary.surface,
    },
    accentBorder: {
      width: 4,
      backgroundColor: theme.colors.primary.main,
    },
    content: {
      flex: 1,
      padding: theme.spacing.inset.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      backgroundColor: theme.colors.primary.surface,
    },
    avatarLabel: {
      color: theme.colors.primary.main,
      fontWeight: '600',
    },
    headerText: {
      flex: 1,
      marginLeft: theme.spacing.inline.sm,
    },
    tripName: {
      color: theme.colors.content.primary,
      fontWeight: '600',
    },
    inviterText: {
      color: theme.colors.content.secondary,
    },
    inviteIcon: {
      marginLeft: theme.spacing.inline.sm,
    },
    message: {
      marginTop: theme.spacing.stack.sm,
      color: theme.colors.content.secondary,
      fontStyle: 'italic',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.stack.md,
    },
    timestamp: {
      color: theme.colors.content.tertiary,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.inline.sm,
    },
    // A10: Ensure proper touch targets (44px minimum)
    touchTarget: {
      minHeight: 44,
    },
    declineButton: {
      borderColor: theme.colors.border.default,
    },
    declineLabel: {
      color: theme.colors.content.secondary,
    },
    acceptButton: {
      backgroundColor: theme.colors.primary.main,
    },
    resultContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.inline.xs,
    },
    resultText: {
      fontWeight: '600',
    },
    acceptedText: {
      color: theme.colors.status.success.content,
    },
    declinedText: {
      color: theme.colors.content.tertiary,
    },
    errorText: {
      color: theme.colors.status.error.content,
    },
    errorContainer: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: theme.spacing.stack.xs,
    },
  });
