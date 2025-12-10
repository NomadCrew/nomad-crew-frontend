import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Surface, Avatar, Button } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { InvitationDetails, InvitationError } from '../types';
import {
  MapPin,
  Calendar,
  User,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';

interface InvitationPreviewProps {
  invitation: InvitationDetails | null;
  error: InvitationError | null;
  isLoading: boolean;
  isAccepting: boolean;
  isDeclining: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onAction?: () => void;
}

export const InvitationPreview: React.FC<InvitationPreviewProps> = ({
  invitation,
  error,
  isLoading,
  isAccepting,
  isDeclining,
  onAccept,
  onDecline,
  onAction,
}) => {
  const theme = useAppTheme().theme;
  const styles = createStyles(theme);

  // Format date range
  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return 'Dates not specified';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  // Calculate days until expiration
  const getDaysUntilExpiry = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format role for display
  const formatRole = (role?: string) => {
    if (!role) return 'Member';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <Surface style={styles.errorCard} elevation={2}>
          <View style={styles.errorIconContainer}>
            <AlertCircle size={48} color={theme.colors.status.error.content} />
          </View>
          <Text style={styles.errorTitle}>{error.title}</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          {error.action && onAction && (
            <Button
              mode="contained"
              onPress={onAction}
              style={styles.actionButton}
              labelStyle={styles.buttonLabel}
            >
              {error.action === 'go_to_trips' && 'Go to My Trips'}
              {error.action === 'switch_account' && 'Switch Account'}
              {error.action === 'view_trip' && 'View Trip'}
              {error.action === 'retry' && 'Try Again'}
            </Button>
          )}
        </Surface>
      </View>
    );
  }

  // Loading state
  if (isLoading || !invitation) {
    return (
      <View style={styles.container}>
        <Surface style={styles.card} elevation={2}>
          <View style={styles.loadingPlaceholder}>
            <View style={[styles.placeholderBlock, styles.placeholderTitle]} />
            <View style={[styles.placeholderBlock, styles.placeholderText]} />
            <View style={[styles.placeholderBlock, styles.placeholderText]} />
          </View>
        </Surface>
      </View>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(invitation.expiresAt);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>You're Invited!</Text>

      {/* Trip Card */}
      <Surface style={styles.card} elevation={2}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripName}>{invitation.trip?.name || 'Trip'}</Text>

          {invitation.trip?.description && (
            <Text style={styles.tripDescription} numberOfLines={2}>
              {invitation.trip.description}
            </Text>
          )}

          <View style={styles.detailRow}>
            <Calendar size={16} color={theme.colors.content.secondary} />
            <Text style={styles.detailText}>
              {formatDateRange(invitation.trip?.startDate, invitation.trip?.endDate)}
            </Text>
          </View>
        </View>
      </Surface>

      {/* Invitation Details Card */}
      <Surface style={styles.card} elevation={2}>
        {/* Inviter Info */}
        {invitation.inviter && (
          <View style={styles.inviterRow}>
            <Avatar.Text
              size={40}
              label={invitation.inviter.displayName?.substring(0, 2).toUpperCase() || 'U'}
              style={styles.avatar}
            />
            <View style={styles.inviterInfo}>
              <Text style={styles.inviterLabel}>Invited by</Text>
              <Text style={styles.inviterName}>
                {invitation.inviter.displayName || invitation.inviter.username}
              </Text>
            </View>
          </View>
        )}

        {/* Role */}
        <View style={styles.detailRow}>
          <Shield size={16} color={theme.colors.content.secondary} />
          <Text style={styles.detailText}>
            You'll join as: <Text style={styles.roleText}>{formatRole(invitation.role)}</Text>
          </Text>
        </View>

        {/* Expiration */}
        {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
          <View style={styles.detailRow}>
            <Clock
              size={16}
              color={
                daysUntilExpiry <= 2
                  ? theme.colors.status.warning.content
                  : theme.colors.content.secondary
              }
            />
            <Text style={[styles.detailText, daysUntilExpiry <= 2 && styles.warningText]}>
              {daysUntilExpiry === 1 ? 'Expires tomorrow' : `Expires in ${daysUntilExpiry} days`}
            </Text>
          </View>
        )}
      </Surface>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={onDecline}
          loading={isDeclining}
          disabled={isAccepting || isDeclining}
          style={[styles.button, styles.declineButton]}
          labelStyle={styles.declineButtonLabel}
          icon={({ size, color }) => <XCircle size={size} color={color} />}
        >
          Decline
        </Button>
        <Button
          mode="contained"
          onPress={onAccept}
          loading={isAccepting}
          disabled={isAccepting || isDeclining}
          style={[styles.button, styles.acceptButton]}
          labelStyle={styles.buttonLabel}
          icon={({ size, color }) => <CheckCircle size={size} color={color} />}
        >
          Accept
        </Button>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.inset.lg,
      justifyContent: 'center',
    },
    header: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.content.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.stack.lg,
    },
    card: {
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.inset.lg,
      marginBottom: theme.spacing.stack.md,
      backgroundColor: theme.colors.surface.default,
    },
    errorCard: {
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.inset.xl,
      backgroundColor: theme.colors.surface.default,
      alignItems: 'center',
    },
    errorIconContainer: {
      marginBottom: theme.spacing.stack.md,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.status.error.content,
      textAlign: 'center',
      marginBottom: theme.spacing.stack.sm,
    },
    errorMessage: {
      fontSize: 16,
      color: theme.colors.content.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.stack.lg,
      lineHeight: 22,
    },
    tripInfo: {
      gap: theme.spacing.stack.sm,
    },
    tripName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.content.primary,
    },
    tripDescription: {
      fontSize: 14,
      color: theme.colors.content.secondary,
      lineHeight: 20,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.inline.sm,
      marginTop: theme.spacing.stack.xs,
    },
    detailText: {
      fontSize: 14,
      color: theme.colors.content.secondary,
    },
    roleText: {
      fontWeight: '600',
      color: theme.colors.primary.main,
    },
    warningText: {
      color: theme.colors.status.warning.content,
    },
    inviterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.stack.md,
      paddingBottom: theme.spacing.stack.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
    },
    avatar: {
      backgroundColor: theme.colors.primary.main,
    },
    inviterInfo: {
      marginLeft: theme.spacing.inline.md,
    },
    inviterLabel: {
      fontSize: 12,
      color: theme.colors.content.tertiary,
    },
    inviterName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.content.primary,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: theme.spacing.inline.md,
      marginTop: theme.spacing.stack.md,
    },
    button: {
      flex: 1,
      borderRadius: theme.borderRadius.md,
    },
    acceptButton: {
      backgroundColor: theme.colors.primary.main,
    },
    declineButton: {
      borderColor: theme.colors.border.default,
    },
    declineButtonLabel: {
      color: theme.colors.content.secondary,
    },
    buttonLabel: {
      fontSize: 16,
      fontWeight: '600',
    },
    actionButton: {
      minWidth: 150,
      borderRadius: theme.borderRadius.md,
    },
    loadingPlaceholder: {
      gap: theme.spacing.stack.md,
    },
    placeholderBlock: {
      backgroundColor: theme.colors.surface.variant,
      borderRadius: theme.borderRadius.sm,
    },
    placeholderTitle: {
      height: 24,
      width: '60%',
    },
    placeholderText: {
      height: 16,
      width: '100%',
    },
  });

export default InvitationPreview;
